import { useEffect } from 'react';
import type { GameSummary } from '../api/types';
import { MoveTable } from '../components/MoveTable';
import { ScreenHeader } from '../components/ScreenHeader';
import { cellKey, formatMatchup, formatResult, setupLabel } from '../utils/format';

interface HistoryScreenProps {
  history: GameSummary[] | null;
  error: string | null;
  onLoad: () => void;
  onBack: () => void;
}

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

export function HistoryScreen({ history, error, onLoad, onBack }: HistoryScreenProps) {
  useEffect(() => {
    onLoad();
  }, [onLoad]);

  return (
    <>
      <ScreenHeader title="Match history" onBack={onBack} />
      <main className="page-body">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {history === null ? (
          !error && <p className="empty">Loading matches…</p>
        ) : history.length === 0 ? (
          <p className="empty">No finished games yet. Every game you finish shows up here.</p>
        ) : (
          <ol className="matches">
            {history.map((match, index) => (
              <li key={match.id} className="match">
                <details>
                  <summary className="match__summary">
                    <span className="match__number">#{history.length - index}</span>
                    <span className="match__players">{formatMatchup(match.playerNames)}</span>
                    <span className={`match__result match__result--${(match.winner ?? 'draw').toLowerCase()}`}>
                      {formatResult(match)}
                    </span>
                    <span className="match__meta">
                      {setupLabel(match)} · {match.moves.length} moves · {timeFormat.format(new Date(match.finishedAt))}
                    </span>
                  </summary>
                  <div className="match__details">
                    <MiniBoard match={match} />
                    <MoveTable moves={match.moves} caption={`Moves for match ${history.length - index}`} />
                  </div>
                </details>
              </li>
            ))}
          </ol>
        )}
      </main>
    </>
  );
}

function MiniBoard({ match }: { match: GameSummary }) {
  const winning = new Set(match.winningCells.map(cellKey));
  return (
    <div className="mini-board" aria-hidden="true">
      {match.board.flatMap((cells, row) =>
        cells.map((value, column) => {
          const key = cellKey({ row, column });
          const classes = ['mini-board__cell'];
          if (value) classes.push(`mini-board__cell--${value.toLowerCase()}`);
          if (winning.has(key)) classes.push('is-winning');
          return (
            <span key={key} className={classes.join(' ')}>
              {value ?? ''}
            </span>
          );
        }),
      )}
    </div>
  );
}
