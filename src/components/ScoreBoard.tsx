import type { Scoreboard } from '../api/types';

interface ScoreBoardProps {
  scoreboard: Scoreboard | null;
  disabled: boolean;
  onReset: () => void;
}

export function ScoreBoard({ scoreboard, disabled, onReset }: ScoreBoardProps) {
  const scores = scoreboard ?? { xWins: 0, oWins: 0, draws: 0 };
  const isEmpty = scores.xWins + scores.oWins + scores.draws === 0;

  return (
    <section className="panel" aria-labelledby="scoreboard-heading">
      <div className="panel__head">
        <h2 id="scoreboard-heading">Scoreboard</h2>
        <button type="button" className="link-button" onClick={onReset} disabled={disabled || isEmpty}>
          Reset scoreboard
        </button>
      </div>
      <dl className="tally">
        <div className="tally__item tally__item--x">
          <dt>X wins</dt>
          <dd>{scores.xWins}</dd>
        </div>
        <div className="tally__item tally__item--o">
          <dt>O wins</dt>
          <dd>{scores.oWins}</dd>
        </div>
        <div className="tally__item">
          <dt>Draws</dt>
          <dd>{scores.draws}</dd>
        </div>
      </dl>
    </section>
  );
}
