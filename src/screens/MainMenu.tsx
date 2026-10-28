interface MainMenuProps {
  canContinue: boolean;
  disabled: boolean;
  onContinue: () => void;
  onStart: () => void;
  onHistory: () => void;
  onScoreboard: () => void;
  onRules: () => void;
}

export function MainMenu({ canContinue, disabled, onContinue, onStart, onHistory, onScoreboard, onRules }: MainMenuProps) {
  return (
    <main className="menu">
      <h1 className="menu__heading" tabIndex={-1}>
        <span className="menu__eyebrow">Welcome to</span>{' '}
        <span className="menu__title">
          Tic <span className="neon-o">Tac</span> Toe
        </span>
      </h1>
      <p className="menu__tagline">Three in a row wins. Challenge a friend or take on the computer.</p>

      <nav aria-label="Main menu">
        <ul className="menu__list">
          {canContinue && (
            <li>
              <button type="button" className="menu__item" onClick={onContinue} disabled={disabled}>
                Continue game
              </button>
            </li>
          )}
          <li>
            <button type="button" className="menu__item menu__item--primary" onClick={onStart} disabled={disabled}>
              Start game
            </button>
          </li>
          <li>
            <button type="button" className="menu__item" onClick={onHistory} disabled={disabled}>
              Match history
            </button>
          </li>
          <li>
            <button type="button" className="menu__item" onClick={onScoreboard} disabled={disabled}>
              Scoreboard
            </button>
          </li>
          <li>
            <button type="button" className="menu__item" onClick={onRules}>
              How to play
            </button>
          </li>
        </ul>
      </nav>
    </main>
  );
}
