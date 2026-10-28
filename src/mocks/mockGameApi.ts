// In-memory stand-in for the .NET API, following the same contract and rules
// described in the README. Used by `npm run dev` and by the tests.
import { ApiError } from '../api/client';
import type { GameApi } from '../api/gameApi';
import type {
  CellPosition,
  CreateGameRequest,
  Difficulty,
  GameMode,
  GameState,
  GameSummary,
  Move,
  Player,
  PlayerNames,
  Scoreboard,
} from '../api/types';
import { buildBoard, chooseComputerMove, DIFFICULTIES, evaluateBoard, isOnBoard, opponentOf, playerForMove } from './rules';

interface GameRecord {
  id: string;
  mode: GameMode;
  humanPlayer: Player | null;
  difficulty: Difficulty | null;
  playerNames: PlayerNames;
  moves: Move[];
}

interface MockOptions {
  latencyMs?: number;
  /** Randomness for the weaker computer levels, injectable so tests are repeatable. */
  random?: () => number;
}

const MAX_NAME_LENGTH = 20;

function resolveNames(request: CreateGameRequest, humanPlayer: Player | null): PlayerNames {
  const defaults: PlayerNames = humanPlayer
    ? ({ [humanPlayer]: 'You', [opponentOf(humanPlayer)]: 'Computer' } as PlayerNames)
    : { X: 'Player X', O: 'Player O' };
  const clean = (name: string | undefined, fallback: string) =>
    name?.trim().slice(0, MAX_NAME_LENGTH) || fallback;
  return { X: clean(request.playerNames?.X, defaults.X), O: clean(request.playerNames?.O, defaults.O) };
}

export function createMockGameApi({ latencyMs = 0, random = Math.random }: MockOptions = {}): GameApi {
  const games = new Map<string, GameRecord>();
  const history: GameSummary[] = [];
  const scoreboard: Scoreboard = { xWins: 0, oWins: 0, draws: 0 };
  let nextId = 1;
  let nextHistoryId = 1;

  const respond = <T,>(handler: () => T): Promise<T> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // Clone so callers can't mutate server-side state, just like a real network hop.
          resolve(JSON.parse(JSON.stringify(handler())) as T);
        } catch (error) {
          reject(error);
        }
      }, latencyMs);
    });

  const findGame = (gameId: string) => {
    const game = games.get(gameId);
    if (!game) throw new ApiError('That game no longer exists. Start a new game.', 404);
    return game;
  };

  const addToScore = (winner: Player | null) => {
    if (winner === 'X') scoreboard.xWins += 1;
    else if (winner === 'O') scoreboard.oWins += 1;
    else scoreboard.draws += 1;
  };

  const computerOf = (game: GameRecord): Player | null =>
    game.humanPlayer ? opponentOf(game.humanPlayer) : null;

  const toState = (game: GameRecord): GameState => {
    const board = buildBoard(game.moves);
    const outcome = evaluateBoard(board);
    return {
      id: game.id,
      mode: game.mode,
      humanPlayer: game.humanPlayer,
      difficulty: game.difficulty,
      playerNames: game.playerNames,
      board,
      currentPlayer: playerForMove(game.moves.length),
      status: outcome.status,
      winner: outcome.winner,
      winningCells: outcome.winningCells,
      moves: game.moves,
      // Option A: a finished game is final, so its result can't be undone off the scoreboard.
      // In computer mode only the human's moves can be taken back; the computer's opener stays.
      canUndo:
        outcome.status === 'InProgress' &&
        (game.humanPlayer
          ? game.moves.some((move) => move.player === game.humanPlayer)
          : game.moves.length > 0),
    };
  };

  const applyMove = (game: GameRecord, cell: CellPosition) => {
    game.moves.push({
      moveNumber: game.moves.length + 1,
      player: playerForMove(game.moves.length),
      row: cell.row,
      column: cell.column,
    });
    const board = buildBoard(game.moves);
    const outcome = evaluateBoard(board);
    // No move is accepted after the game ends and undo is refused, so this runs once per round.
    if (outcome.status !== 'InProgress') {
      addToScore(outcome.winner);
      history.unshift({
        id: `h-${nextHistoryId++}`,
        gameId: game.id,
        mode: game.mode,
        humanPlayer: game.humanPlayer,
        difficulty: game.difficulty,
        playerNames: { ...game.playerNames },
        board,
        status: outcome.status,
        winner: outcome.winner,
        winningCells: outcome.winningCells,
        moves: [...game.moves],
        finishedAt: new Date().toISOString(),
      });
    }
    return outcome;
  };

  /** The computer moves whenever it's its turn: after the human, or first if it plays X. */
  const playComputerIfDue = (game: GameRecord) => {
    const computer = computerOf(game);
    const board = buildBoard(game.moves);
    if (!computer || evaluateBoard(board).status !== 'InProgress') return;
    if (playerForMove(game.moves.length) !== computer) return;
    const reply = chooseComputerMove(board, computer, game.difficulty ?? 'Hard', random);
    if (reply) applyMove(game, reply);
  };

  return {
    createGame: (request) =>
      respond(() => {
        if (request.mode !== 'TwoPlayer' && request.mode !== 'Computer') {
          throw new ApiError('Choose a game mode: TwoPlayer or Computer.', 400);
        }
        if (request.humanPlayer !== undefined && request.humanPlayer !== 'X' && request.humanPlayer !== 'O') {
          throw new ApiError('The human player must be X or O.', 400);
        }
        if (request.difficulty !== undefined && !DIFFICULTIES.includes(request.difficulty)) {
          throw new ApiError(`Difficulty must be one of: ${DIFFICULTIES.join(', ')}.`, 400);
        }
        const isComputer = request.mode === 'Computer';
        const humanPlayer = isComputer ? (request.humanPlayer ?? 'X') : null;
        const game: GameRecord = {
          id: `mock-${nextId++}`,
          mode: request.mode,
          humanPlayer,
          difficulty: isComputer ? (request.difficulty ?? 'Hard') : null,
          playerNames: resolveNames(request, humanPlayer),
          moves: [],
        };
        games.set(game.id, game);
        playComputerIfDue(game);
        return toState(game);
      }),

    getGame: (gameId) => respond(() => toState(findGame(gameId))),

    makeMove: (gameId, move) =>
      respond(() => {
        const game = findGame(gameId);
        const board = buildBoard(game.moves);
        const cell = { row: move.row, column: move.column };
        const expected = playerForMove(game.moves.length);

        if (evaluateBoard(board).status !== 'InProgress') {
          throw new ApiError('This game is over. Reset the game to play again.', 409);
        }
        if (!isOnBoard(cell)) {
          throw new ApiError('That cell is outside the board.', 400);
        }
        if (move.player !== expected) {
          throw new ApiError(`It's ${expected}'s turn, not ${move.player}'s.`, 409);
        }
        if (board[cell.row][cell.column] !== null) {
          throw new ApiError('That cell is already taken. Pick an empty one.', 409);
        }

        applyMove(game, cell);
        // The computer replies inside the same request, so it can never act on a finished game.
        playComputerIfDue(game);
        return toState(game);
      }),

    undoMove: (gameId) =>
      respond(() => {
        const game = findGame(gameId);
        const state = toState(game);
        if (state.status !== 'InProgress') {
          throw new ApiError('This game is over, so its result is final. Start a new game to play again.', 409);
        }
        if (!state.canUndo) {
          throw new ApiError('There are no moves to undo.', 409);
        }

        // Computer mode removes the computer's reply and the human move before it.
        const lastMove = game.moves[game.moves.length - 1];
        const count = game.humanPlayer && lastMove.player !== game.humanPlayer ? 2 : 1;
        game.moves = game.moves.slice(0, game.moves.length - count);
        return toState(game);
      }),

    resetGame: (gameId) =>
      respond(() => {
        const game = findGame(gameId);
        // A finished game's result stays on the scoreboard and in the history; the new round starts unscored.
        game.moves = [];
        playComputerIfDue(game);
        return toState(game);
      }),

    getHistory: () => respond(() => history),

    getScoreboard: () => respond(() => scoreboard),

    resetScoreboard: () =>
      respond(() => {
        scoreboard.xWins = 0;
        scoreboard.oWins = 0;
        scoreboard.draws = 0;
        return scoreboard;
      }),
  };
}
