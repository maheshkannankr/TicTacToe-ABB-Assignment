import type { Scoreboard } from '../api/types';
import { ScoreBoard } from '../components/ScoreBoard';
import { ScreenHeader } from '../components/ScreenHeader';

interface ScoreboardScreenProps {
  scoreboard: Scoreboard | null;
  isBusy: boolean;
  error: string | null;
  onReset: () => void;
  onBack: () => void;
}

export function ScoreboardScreen({ scoreboard, isBusy, error, onReset, onBack }: ScoreboardScreenProps) {
  return (
    <>
      <ScreenHeader title="Scoreboard" onBack={onBack} />
      <main className="page-body page-body--narrow">
        <ScoreBoard scoreboard={scoreboard} disabled={isBusy} onReset={onReset} />
        <p className="hint">
          Counts every finished game in this session, in both modes. Resetting a game keeps the score; only Reset
          scoreboard clears it.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </main>
    </>
  );
}

export function RulesScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <ScreenHeader title="How to play" onBack={onBack} />
      <main className="page-body page-body--narrow">
        <section className="panel rules">
          <h2>The game</h2>
          <ul>
            <li>Players take turns placing X or O on a 3 × 3 board. X always moves first.</li>
            <li>Get three of your marks in a row, column or diagonal to win.</li>
            <li>If all nine cells fill up with no line, the game is a draw.</li>
          </ul>
        </section>
        <section className="panel rules">
          <h2>Starting a game</h2>
          <ul>
            <li>
              Pick <strong>Single player</strong> to play the computer, or <strong>Multiplayer</strong> for two
              players on one device.
            </li>
            <li>
              Against the computer, pick a level from 1 (<strong>Novice</strong>) to 5 (<strong>Unbeatable</strong>).
            </li>
            <li>Call heads or tails. Whoever wins the toss picks X or O. If the computer wins, it takes X.</li>
          </ul>
        </section>
        <section className="panel rules">
          <h2>During a game</h2>
          <ul>
            <li>
              <strong>Undo last move</strong> takes back one move. Against the computer it takes back your move
              and the computer's reply together.
            </li>
            <li>When a game ends the board locks and Undo and Reset are switched off. Start a new game to play again.</li>
            <li>
              <strong>New game</strong> starts a fresh game with the same players, sides and level. To change them, go
              back to the main menu and choose Start game.
            </li>
            <li>
              <strong>Reset game</strong> clears the board with the same players and sides. The scoreboard stays.
            </li>
          </ul>
        </section>
        <section className="panel rules">
          <h2>The computer</h2>
          <ul>
            <li><strong>1 · Novice</strong> plays any free cell.</li>
            <li><strong>2 · Easy</strong> takes a winning move when it has one.</li>
            <li><strong>3 · Medium</strong> also blocks you when you're about to win.</li>
            <li>
              <strong>4 · Hard</strong> wins, blocks, then takes the center, a corner, or any free cell.
            </li>
            <li><strong>5 · Unbeatable</strong> looks ahead to the end of the game. The best you can do is draw.</li>
          </ul>
        </section>
      </main>
    </>
  );
}
