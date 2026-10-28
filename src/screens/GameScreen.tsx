import type { CellPosition, GameState, Scoreboard } from '../api/types';
import { Board } from '../components/Board';
import { GameControls } from '../components/GameControls';
import { MoveHistory } from '../components/MoveHistory';
import { PlayersBar } from '../components/PlayersBar';
import { ScoreBoard } from '../components/ScoreBoard';
import { ScreenHeader } from '../components/ScreenHeader';
import { StatusLine } from '../components/StatusLine';
import { setupLabel } from '../utils/format';

interface GameScreenProps {
  game: GameState;
  scoreboard: Scoreboard | null;
  isBusy: boolean;
  error: string | null;
  onPlay: (cell: CellPosition) => void;
  onUndo: () => void;
  onReset: () => void;
  onNewGame: () => void;
  onResetScoreboard: () => void;
  onMenu: () => void;
}

export function GameScreen({
  game,
  scoreboard,
  isBusy,
  error,
  onPlay,
  onUndo,
  onReset,
  onNewGame,
  onResetScoreboard,
  onMenu,
}: GameScreenProps) {
  return (
    <>
      <ScreenHeader
        title={
          <>
            Tic <span className="neon-o">Tac</span> Toe
          </>
        }
        onBack={onMenu}
      >
        <span className="badge">{setupLabel(game)}</span>
      </ScreenHeader>

      <main className="layout">
        <section className="play" aria-label="Current game">
          <PlayersBar game={game} />
          <StatusLine game={game} />
          <Board game={game} disabled={isBusy} onPlay={onPlay} />
          <GameControls
            mode={game.mode}
            isOver={game.status !== 'InProgress'}
            canUndo={game.canUndo}
            disabled={isBusy}
            error={error}
            onUndo={onUndo}
            onReset={onReset}
            onNewGame={onNewGame}
          />
        </section>

        <aside className="side">
          <ScoreBoard scoreboard={scoreboard} disabled={isBusy} onReset={onResetScoreboard} />
          <MoveHistory moves={game.moves} />
        </aside>
      </main>
    </>
  );
}
