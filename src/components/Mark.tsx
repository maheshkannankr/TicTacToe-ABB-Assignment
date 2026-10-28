import type { Player } from '../api/types';

/**
 * Neon-tube X / O. The strokes light up along their length when the mark first mounts,
 * which is exactly when a move lands on the board.
 */
export function Mark({ player }: { player: Player }) {
  if (player === 'X') {
    return (
      <svg className="mark mark--x" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <path pathLength={1} d="M22 22 L 78 78" />
        <path pathLength={1} d="M78 22 L 22 78" />
      </svg>
    );
  }

  return (
    <svg className="mark mark--o" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {/* Rotated so the tube starts lighting from the top. */}
      <circle pathLength={1} cx="50" cy="50" r="30" transform="rotate(-90 50 50)" />
    </svg>
  );
}
