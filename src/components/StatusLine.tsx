import type { GameState } from '../api/types';

function describe(game: GameState): { text: string; tone: 'x' | 'o' | 'draw' } {
  const { humanPlayer, playerNames } = game;

  if (game.status === 'Won' && game.winner) {
    const tone = game.winner === 'X' ? 'x' : 'o';
    if (humanPlayer) return { text: game.winner === humanPlayer ? 'You win!' : 'Computer wins', tone };
    return { text: `${playerNames[game.winner]} wins!`, tone };
  }

  if (game.status === 'Draw') {
    return { text: "It's a draw", tone: 'draw' };
  }

  const tone = game.currentPlayer === 'X' ? 'x' : 'o';
  if (humanPlayer) return { text: `Your move (${humanPlayer})`, tone };
  return { text: `${playerNames[game.currentPlayer]}'s move (${game.currentPlayer})`, tone };
}

export function StatusLine({ game }: { game: GameState }) {
  const { text, tone } = describe(game);
  return (
    <p className={`status status--${tone}`} role="status">
      {text}
    </p>
  );
}
