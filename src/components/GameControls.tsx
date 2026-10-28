import { Plus, RotateCcw, Undo2 } from 'lucide-react';
import type { GameMode } from '../api/types';

interface GameControlsProps {
  mode: GameMode;
  isOver: boolean;
  canUndo: boolean;
  disabled: boolean;
  error: string | null;
  onUndo: () => void;
  onReset: () => void;
  onNewGame: () => void;
}

const hintFor = (mode: GameMode, isOver: boolean) => {
  if (isOver) return 'Game over. Start a new game to play again.';
  return mode === 'Computer' ? "Undo takes back your last move and the computer's reply." : 'Undo takes back the last move.';
};

/** Icon-only actions. The label is the accessible name and the hover tooltip. */
export function GameControls({ mode, isOver, canUndo, disabled, error, onUndo, onReset, onNewGame }: GameControlsProps) {
  const actions = [
    // canUndo comes from the server, which turns it off once the game is over.
    { label: 'Undo last move', Icon: Undo2, onClick: onUndo, isDisabled: disabled || !canUndo, pink: false },
    { label: 'Reset game', Icon: RotateCcw, onClick: onReset, isDisabled: disabled || isOver, pink: false },
    { label: 'New game', Icon: Plus, onClick: onNewGame, isDisabled: disabled, pink: true },
  ];

  return (
    <div className="controls">
      <div className="controls__buttons">
        {actions.map(({ label, Icon, onClick, isDisabled, pink }) => (
          <button
            key={label}
            type="button"
            className={pink ? 'icon-button icon-button--pink' : 'icon-button'}
            aria-label={label}
            title={label}
            onClick={onClick}
            disabled={isDisabled}
          >
            <Icon aria-hidden="true" focusable="false" strokeWidth={2.25} />
          </button>
        ))}
      </div>
      {/* One fixed-height slot for the hint or an error, so nothing below it shifts when the text changes. */}
      <div className="controls__message">
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : (
          <p className="hint">{hintFor(mode, isOver)}</p>
        )}
      </div>
    </div>
  );
}
