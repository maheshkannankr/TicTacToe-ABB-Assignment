import type { GameMode } from '../api/types';

interface GameControlsProps {
  mode: GameMode;
  isOver: boolean;
  canUndo: boolean;
  disabled: boolean;
  onUndo: () => void;
  onReset: () => void;
  onNewGame: () => void;
}

export function GameControls({ mode, isOver, canUndo, disabled, onUndo, onReset, onNewGame }: GameControlsProps) {
  return (
    <div className="controls">
      <div className="controls__buttons">
        <button type="button" className="button" onClick={onUndo} disabled={disabled || isOver || !canUndo}>
          Undo<span className="controls__more"> last move</span>
        </button>
        <button type="button" className="button" onClick={onReset} disabled={disabled || isOver}>
          Reset<span className="controls__more"> game</span>
        </button>
        <button type="button" className="button button--pink" onClick={onNewGame} disabled={disabled}>
          New game
        </button>
      </div>
      {isOver && <p className="hint">Game over. Start a new game to play again.</p>}
      {mode === 'Computer' && !isOver && (
        <p className="hint">Undo takes back your last move and the computer's reply.</p>
      )}
    </div>
  );
}
