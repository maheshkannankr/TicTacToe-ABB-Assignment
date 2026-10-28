import type { Move } from '../api/types';
import { formatPosition } from '../utils/format';

export function MoveTable({ moves, caption }: { moves: Move[]; caption?: string }) {
  return (
    <table className="moves">
      {caption && <caption className="visually-hidden">{caption}</caption>}
      <thead>
        <tr>
          <th scope="col">Move</th>
          <th scope="col">Player</th>
          <th scope="col">Position</th>
        </tr>
      </thead>
      <tbody>
        {moves.map((move) => (
          <tr key={move.moveNumber}>
            <td>{move.moveNumber}</td>
            <td className={`moves__player moves__player--${move.player.toLowerCase()}`}>{move.player}</td>
            <td>{formatPosition(move)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
