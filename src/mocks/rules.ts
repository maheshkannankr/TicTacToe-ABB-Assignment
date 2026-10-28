// Game rules used ONLY by the mock API. In the real app the .NET backend owns
// these rules; the frontend never decides winners or computer moves itself.
import type { Board, CellPosition, Difficulty, GameStatus, Move, Player } from '../api/types';

const INDEXES = [0, 1, 2];

export const WINNING_LINES: CellPosition[][] = [
  ...INDEXES.map((row) => INDEXES.map((column) => ({ row, column }))),
  ...INDEXES.map((column) => INDEXES.map((row) => ({ row, column }))),
  INDEXES.map((i) => ({ row: i, column: i })),
  INDEXES.map((i) => ({ row: i, column: 2 - i })),
];

const ALL_CELLS: CellPosition[] = INDEXES.flatMap((row) => INDEXES.map((column) => ({ row, column })));
const CENTER: CellPosition = { row: 1, column: 1 };
const CORNERS: CellPosition[] = [
  { row: 0, column: 0 },
  { row: 0, column: 2 },
  { row: 2, column: 0 },
  { row: 2, column: 2 },
];

export function buildBoard(moves: Move[]): Board {
  const board: Board = INDEXES.map(() => INDEXES.map(() => null));
  for (const move of moves) {
    board[move.row][move.column] = move.player;
  }
  return board;
}

export interface Outcome {
  status: GameStatus;
  winner: Player | null;
  winningCells: CellPosition[];
}

export function evaluateBoard(board: Board): Outcome {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line.map(({ row, column }) => board[row][column]);
    if (a && a === b && b === c) {
      return { status: 'Won', winner: a, winningCells: line };
    }
  }
  const isFull = board.every((row) => row.every((cell) => cell !== null));
  return { status: isFull ? 'Draw' : 'InProgress', winner: null, winningCells: [] };
}

/** X always opens, so the player for a move depends only on how many moves came before it. */
export const playerForMove = (movesPlayed: number): Player => (movesPlayed % 2 === 0 ? 'X' : 'O');

export const opponentOf = (player: Player): Player => (player === 'X' ? 'O' : 'X');

export const isOnBoard = ({ row, column }: CellPosition) =>
  Number.isInteger(row) && Number.isInteger(column) && row >= 0 && row < 3 && column >= 0 && column < 3;

/** The empty cell that would complete a line of three for `player`, if any. */
function findCompletingCell(board: Board, player: Player): CellPosition | null {
  for (const line of WINNING_LINES) {
    const values = line.map(({ row, column }) => board[row][column]);
    const owned = values.filter((value) => value === player).length;
    const emptyIndex = values.indexOf(null);
    if (owned === 2 && emptyIndex !== -1) {
      return line[emptyIndex];
    }
  }
  return null;
}

const emptyCells = (board: Board) => ALL_CELLS.filter(({ row, column }) => board[row][column] === null);

/** Priority: win → block → center → corner → any empty cell. The strategy from the brief. */
function priorityMove(board: Board, computer: Player): CellPosition | null {
  const isEmpty = ({ row, column }: CellPosition) => board[row][column] === null;
  return (
    findCompletingCell(board, computer) ??
    findCompletingCell(board, opponentOf(computer)) ??
    (isEmpty(CENTER) ? CENTER : null) ??
    CORNERS.find(isEmpty) ??
    ALL_CELLS.find(isEmpty) ??
    null
  );
}

/** Best score `toMove` can force: +10 for a win, -10 for a loss, sooner wins scoring higher. */
function minimax(board: Board, toMove: Player, depth: number): number {
  const { status, winner } = evaluateBoard(board);
  if (status === 'Won') return winner === toMove ? 10 - depth : depth - 10;
  if (status === 'Draw') return 0;
  let best = -Infinity;
  for (const { row, column } of emptyCells(board)) {
    board[row][column] = toMove;
    best = Math.max(best, -minimax(board, opponentOf(toMove), depth + 1));
    board[row][column] = null;
  }
  return best;
}

/** A move that never loses. Ties go to the center, then corners, then edges. */
function perfectMove(board: Board, computer: Player): CellPosition | null {
  const work = board.map((row) => [...row]);
  let best: CellPosition | null = null;
  let bestScore = -Infinity;
  for (const cell of [CENTER, ...CORNERS, ...ALL_CELLS]) {
    if (work[cell.row][cell.column] !== null) continue;
    work[cell.row][cell.column] = computer;
    const score = -minimax(work, opponentOf(computer), 1);
    work[cell.row][cell.column] = null;
    if (score > bestScore) {
      best = cell;
      bestScore = score;
    }
  }
  return best;
}

export const DIFFICULTIES: Difficulty[] = ['Novice', 'Easy', 'Medium', 'Hard', 'Unbeatable'];

/**
 * Levels 1–5. Novice plays any free cell at random, Easy takes a win when it sees one, Medium also blocks,
 * Hard is the brief's strategy (win → block → center → corner → any), and Unbeatable searches every line.
 */
export function chooseComputerMove(
  board: Board,
  computer: Player = 'O',
  difficulty: Difficulty = 'Hard',
  random: () => number = Math.random,
): CellPosition | null {
  const free = emptyCells(board);
  if (free.length === 0) return null;
  const anyCell = () => free[Math.floor(random() * free.length)];

  switch (difficulty) {
    case 'Novice':
      return anyCell();
    case 'Easy':
      return findCompletingCell(board, computer) ?? anyCell();
    case 'Medium':
      return findCompletingCell(board, computer) ?? findCompletingCell(board, opponentOf(computer)) ?? anyCell();
    case 'Hard':
      return priorityMove(board, computer);
    case 'Unbeatable':
      return perfectMove(board, computer);
  }
}
