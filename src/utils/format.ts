import type { CellPosition, Difficulty, GameMode, GameStatus, Player, PlayerNames } from '../api/types';

/** One-based, human-readable cell position, e.g. "Row 1, Column 3". */
export const formatPosition = ({ row, column }: CellPosition) => `Row ${row + 1}, Column ${column + 1}`;

export const cellKey = ({ row, column }: CellPosition) => `${row}-${column}`;

export const modeLabel = (mode: GameMode) => (mode === 'Computer' ? 'Single player' : 'Multiplayer');

/** "Single player · Hard" against the computer, "Multiplayer" otherwise. */
export const setupLabel = ({ mode, difficulty }: { mode: GameMode; difficulty: Difficulty | null }) =>
  difficulty ? `${modeLabel(mode)} · ${difficulty}` : modeLabel(mode);

/** The fields shared by a live game and a history entry that describe who played and how it ended. */
interface Result {
  humanPlayer: Player | null;
  playerNames: PlayerNames;
  status: GameStatus;
  winner: Player | null;
}

/** Past-tense result for the history list, e.g. "You won", "Asha won", "Draw". */
export function formatResult({ humanPlayer, playerNames, status, winner }: Result): string {
  if (status === 'Draw') return 'Draw';
  if (!winner) return 'In progress';
  if (humanPlayer) return winner === humanPlayer ? 'You won' : 'Computer won';
  return `${playerNames[winner]} won`;
}

/** "You (O) vs Computer (X)", always listing X first since X moves first. */
export const formatMatchup = (names: PlayerNames) => `${names.X} (X) vs ${names.O} (O)`;
