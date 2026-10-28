import type { GameState, Player } from '../api/types';

/** Who plays which mark. The side to move (or the winner) is lit up. */
export function PlayersBar({ game }: { game: GameState }) {
  const isLit = (player: Player) =>
    game.status === 'InProgress' ? game.currentPlayer === player : game.winner === player;

  return (
    <ul className="players" aria-label="Players">
      {(['X', 'O'] as const).map((player) => (
        <li
          key={player}
          className={`players__chip players__chip--${player.toLowerCase()}${isLit(player) ? ' is-lit' : ''}`}
        >
          <span className="players__mark" aria-hidden="true">
            {player}
          </span>
          <span className="players__name">
            <span className="visually-hidden">{player}: </span>
            {game.playerNames[player]}
          </span>
        </li>
      ))}
    </ul>
  );
}
