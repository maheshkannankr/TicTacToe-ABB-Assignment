// Shapes exchanged with the .NET API. Keep these in sync with the backend DTOs
// (camelCase JSON, enums serialized as strings). See README › API contract.

export type Player = 'X' | 'O';
export type GameMode = 'TwoPlayer' | 'Computer';
export type GameStatus = 'InProgress' | 'Won' | 'Draw';
/** Computer strength, weakest first. Hard is the strategy from the brief. */
export type Difficulty = 'Novice' | 'Easy' | 'Medium' | 'Hard' | 'Unbeatable';

/** Display name for whoever plays each mark. */
export type PlayerNames = Record<Player, string>;

/** Zero-based board coordinates. The UI shows them one-based. */
export interface CellPosition {
  row: number;
  column: number;
}

export interface Move extends CellPosition {
  moveNumber: number;
  player: Player;
}

/** Body of POST /games. */
export interface CreateGameRequest {
  mode: GameMode;
  /** Computer mode only: the side the human won (or lost) on the toss. Defaults to X. */
  humanPlayer?: Player;
  /** Computer mode only. Defaults to Hard. */
  difficulty?: Difficulty;
  playerNames?: PlayerNames;
}

/** Body of POST /games/{id}/moves. The server rejects it if `player` is not the one to move. */
export interface MoveRequest extends CellPosition {
  player: Player;
}

export type Board = (Player | null)[][];

export interface GameState {
  id: string;
  mode: GameMode;
  /** The human's side in computer mode; null in two-player mode. */
  humanPlayer: Player | null;
  /** Computer mode only; null in two-player mode. */
  difficulty: Difficulty | null;
  playerNames: PlayerNames;
  board: Board;
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  winningCells: CellPosition[];
  moves: Move[];
  canUndo: boolean;
}

/** One finished game, as listed by GET /history (newest first). */
export interface GameSummary {
  id: string;
  gameId: string;
  mode: GameMode;
  humanPlayer: Player | null;
  difficulty: Difficulty | null;
  playerNames: PlayerNames;
  /** Final board, so the client can draw it without replaying the moves. */
  board: Board;
  status: Exclude<GameStatus, 'InProgress'>;
  winner: Player | null;
  winningCells: CellPosition[];
  moves: Move[];
  finishedAt: string;
}

export interface Scoreboard {
  xWins: number;
  oWins: number;
  draws: number;
}
