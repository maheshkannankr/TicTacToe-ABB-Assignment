import { describe, expect, it } from 'vitest';
import type { GameApi } from '../api/gameApi';
import { createMockGameApi } from './mockGameApi';

/** Plays [row, column] pairs in order, alternating X and O (two-player mode). */
async function playAll(api: GameApi, gameId: string, cells: [number, number][]) {
  for (const [index, [row, column]] of cells.entries()) {
    await api.makeMove(gameId, { player: index % 2 === 0 ? 'X' : 'O', row, column });
  }
  return api.getGame(gameId);
}

const X_WINS_TOP_ROW: [number, number][] = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]];
const DRAW: [number, number][] = [[0, 0], [0, 1], [0, 2], [1, 1], [1, 0], [1, 2], [2, 1], [2, 0], [2, 2]];

describe('mock game API', () => {
  it('applies a valid move and switches the turn', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'TwoPlayer' });
    expect(game).toMatchObject({ currentPlayer: 'X', status: 'InProgress', moves: [], canUndo: false });

    const next = await api.makeMove(game.id, { player: 'X', row: 0, column: 2 });
    expect(next.board[0][2]).toBe('X');
    expect(next.currentPlayer).toBe('O');
    expect(next.moves).toEqual([{ moveNumber: 1, player: 'X', row: 0, column: 2 }]);
  });

  it('rejects a move outside the board', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'TwoPlayer' });
    await expect(api.makeMove(game.id, { player: 'X', row: 3, column: 0 })).rejects.toMatchObject({ status: 400 });
    await expect(api.makeMove(game.id, { player: 'X', row: 0, column: -1 })).rejects.toMatchObject({ status: 400 });
    expect((await api.getGame(game.id)).moves).toHaveLength(0);
  });

  it('rejects a move on a taken cell without changing the turn', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'TwoPlayer' });
    await api.makeMove(game.id, { player: 'X', row: 0, column: 0 });
    await expect(api.makeMove(game.id, { player: 'O', row: 0, column: 0 })).rejects.toThrow(/already taken/);
    expect((await api.getGame(game.id)).currentPlayer).toBe('O');
  });

  it('rejects a move by the wrong player', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'TwoPlayer' });
    await expect(api.makeMove(game.id, { player: 'O', row: 0, column: 0 })).rejects.toThrow(/X's turn/);

    const computerGame = await api.createGame({ mode: 'Computer' });
    await api.makeMove(computerGame.id, { player: 'X', row: 0, column: 0 });
    // The computer has already replied, so the human can't play as O.
    await expect(api.makeMove(computerGame.id, { player: 'O', row: 2, column: 2 })).rejects.toThrow(/X's turn/);
  });

  it('rejects moves after the game is won', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'TwoPlayer' });
    const won = await playAll(api, game.id, X_WINS_TOP_ROW);
    expect(won).toMatchObject({ status: 'Won', winner: 'X' });

    await expect(api.makeMove(game.id, { player: 'O', row: 2, column: 2 })).rejects.toThrow(/game is over/);
    expect((await api.getGame(game.id)).moves).toHaveLength(5);
  });

  it('marks a full board with no line as a draw and scores it', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'TwoPlayer' });
    const drawn = await playAll(api, game.id, DRAW);
    expect(drawn).toMatchObject({ status: 'Draw', winner: null, winningCells: [] });
    expect(await api.getScoreboard()).toEqual({ xWins: 0, oWins: 0, draws: 1 });
  });

  it('undoes one move in two-player mode', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'TwoPlayer' });
    await playAll(api, game.id, [[0, 0], [1, 1]]);

    const undone = await api.undoMove(game.id);
    expect(undone.moves).toHaveLength(1);
    expect(undone.board[1][1]).toBeNull();
    expect(undone.currentPlayer).toBe('O');
  });

  it('undoes the move pair in computer mode', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'Computer' });
    const afterMove = await api.makeMove(game.id, { player: 'X', row: 0, column: 0 });
    expect(afterMove.moves.map((m) => m.player)).toEqual(['X', 'O']);

    const undone = await api.undoMove(game.id);
    expect(undone.moves).toHaveLength(0);
    expect(undone.currentPlayer).toBe('X');
    expect(undone.canUndo).toBe(false);
    await expect(api.undoMove(game.id)).rejects.toThrow(/no moves to undo/);
  });

  it('lets the computer reply, but not after X ends the game', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'Computer' });
    // O replies: center, corner (0,2), block (2,1). X then wins down the left column.
    for (const [row, column] of [[0, 0], [2, 2], [2, 0], [1, 0]]) {
      await api.makeMove(game.id, { player: 'X', row, column });
    }
    const won = await api.getGame(game.id);
    expect(won).toMatchObject({ status: 'Won', winner: 'X' });
    expect(won.moves).toHaveLength(7);
    expect(won.moves.at(-1)?.player).toBe('X');

    // The computer never replied, so undo removes only X's winning move.
    const undone = await api.undoMove(game.id);
    expect(undone.moves).toHaveLength(6);
    expect(undone.status).toBe('InProgress');
  });

  it('counts a finished game once and takes it back on undo', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'TwoPlayer' });
    await playAll(api, game.id, X_WINS_TOP_ROW);
    expect(await api.getScoreboard()).toEqual({ xWins: 1, oWins: 0, draws: 0 });

    await api.undoMove(game.id);
    expect(await api.getScoreboard()).toEqual({ xWins: 0, oWins: 0, draws: 0 });
  });

  it('resets the game but keeps the scoreboard', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'Computer' });
    await api.makeMove(game.id, { player: 'X', row: 0, column: 0 });

    const reset = await api.resetGame(game.id);
    expect(reset).toMatchObject({ id: game.id, mode: 'Computer', currentPlayer: 'X', status: 'InProgress', moves: [] });
    expect(reset.board.flat().every((cell) => cell === null)).toBe(true);

    const twoPlayer = await api.createGame({ mode: 'TwoPlayer' });
    await playAll(api, twoPlayer.id, X_WINS_TOP_ROW);
    await api.resetGame(twoPlayer.id);
    expect(await api.getScoreboard()).toEqual({ xWins: 1, oWins: 0, draws: 0 });
  });

  it('resets the scoreboard', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'TwoPlayer' });
    await playAll(api, game.id, DRAW);
    expect(await api.resetScoreboard()).toEqual({ xWins: 0, oWins: 0, draws: 0 });
    expect(await api.getScoreboard()).toEqual({ xWins: 0, oWins: 0, draws: 0 });
  });

  it('stores player names, with defaults for blanks', async () => {
    const api = createMockGameApi();
    const named = await api.createGame({ mode: 'TwoPlayer', playerNames: { X: '  Asha ', O: '' } });
    expect(named.playerNames).toEqual({ X: 'Asha', O: 'Player O' });
    expect(named.humanPlayer).toBeNull();

    const vsComputer = await api.createGame({ mode: 'Computer', humanPlayer: 'O' });
    expect(vsComputer.playerNames).toEqual({ X: 'Computer', O: 'You' });
  });

  it('lets the computer open when the human picks O', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'Computer', humanPlayer: 'O' });
    expect(game.moves).toEqual([{ moveNumber: 1, player: 'X', row: 1, column: 1 }]);
    expect(game.currentPlayer).toBe('O');
    // The computer's opener can't be undone.
    expect(game.canUndo).toBe(false);
    await expect(api.undoMove(game.id)).rejects.toThrow(/no moves to undo/);
    await expect(api.makeMove(game.id, { player: 'X', row: 0, column: 0 })).rejects.toThrow(/O's turn/);
  });

  it('undoes back to the computer opener when the human plays O', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'Computer', humanPlayer: 'O' });
    const afterMove = await api.makeMove(game.id, { player: 'O', row: 0, column: 0 });
    expect(afterMove.moves.map((m) => m.player)).toEqual(['X', 'O', 'X']);

    const undone = await api.undoMove(game.id);
    expect(undone.moves).toEqual(game.moves);
    expect(undone.currentPlayer).toBe('O');
    expect(undone.canUndo).toBe(false);
  });

  it('replays the computer opener after a reset', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'Computer', humanPlayer: 'O' });
    await api.makeMove(game.id, { player: 'O', row: 0, column: 0 });
    const reset = await api.resetGame(game.id);
    expect(reset.moves).toHaveLength(1);
    expect(reset).toMatchObject({ humanPlayer: 'O', currentPlayer: 'O' });
  });

  it('records finished games in the history, newest first', async () => {
    const api = createMockGameApi();
    expect(await api.getHistory()).toEqual([]);

    const first = await api.createGame({ mode: 'TwoPlayer', playerNames: { X: 'Asha', O: 'Ben' } });
    await playAll(api, first.id, X_WINS_TOP_ROW);
    const second = await api.createGame({ mode: 'TwoPlayer' });
    await playAll(api, second.id, DRAW);

    const history = await api.getHistory();
    expect(history.map((entry) => [entry.gameId, entry.status, entry.winner])).toEqual([
      [second.id, 'Draw', null],
      [first.id, 'Won', 'X'],
    ]);
    expect(history[1]).toMatchObject({ playerNames: { X: 'Asha', O: 'Ben' }, mode: 'TwoPlayer' });
    expect(history[1].board[0]).toEqual(['X', 'X', 'X']);
    expect(history[1].moves).toHaveLength(5);
  });

  it('drops a history entry when undo reopens the game, but keeps it on reset', async () => {
    const api = createMockGameApi();
    const game = await api.createGame({ mode: 'TwoPlayer' });
    await playAll(api, game.id, X_WINS_TOP_ROW);
    await api.undoMove(game.id);
    expect(await api.getHistory()).toEqual([]);

    await api.makeMove(game.id, { player: 'X', row: 0, column: 2 });
    await api.resetGame(game.id);
    expect(await api.getHistory()).toHaveLength(1);
  });

  it('stores the computer level, defaults it to Hard, and rejects unknown levels', async () => {
    const api = createMockGameApi({ random: () => 0 });
    expect((await api.createGame({ mode: 'Computer' })).difficulty).toBe('Hard');
    expect((await api.createGame({ mode: 'TwoPlayer', difficulty: 'Easy' })).difficulty).toBeNull();
    await expect(api.createGame({ mode: 'Computer', difficulty: 'Godlike' as never })).rejects.toMatchObject({ status: 400 });

    // Novice with random() = 0 takes the first free cell instead of the center.
    const novice = await api.createGame({ mode: 'Computer', difficulty: 'Novice' });
    const next = await api.makeMove(novice.id, { player: 'X', row: 2, column: 2 });
    expect(next.board[0][0]).toBe('O');
  });
});
