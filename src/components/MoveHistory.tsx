import type { Move } from '../api/types';
import { MoveTable } from './MoveTable';

export function MoveHistory({ moves }: { moves: Move[] }) {
  return (
    <section className="panel" aria-labelledby="history-heading">
      <div className="panel__head">
        <h2 id="history-heading">Move history</h2>
      </div>
      {moves.length === 0 ? (
        <p className="empty">No moves yet. X goes first.</p>
      ) : (
        <div className="history" tabIndex={0} aria-labelledby="history-heading">
          <MoveTable moves={moves} />
        </div>
      )}
    </section>
  );
}
