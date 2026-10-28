import { useEffect, useRef, useState } from 'react';
import { gameApi as defaultApi } from './api';
import type { GameApi } from './api/gameApi';
import type { CreateGameRequest } from './api/types';
import { useGame } from './hooks/useGame';
import { GameScreen } from './screens/GameScreen';
import { type CoinSide, flipFairCoin, GameSetup } from './screens/GameSetup';
import { HistoryScreen } from './screens/HistoryScreen';
import { RulesScreen, ScoreboardScreen } from './screens/InfoScreens';
import { MainMenu } from './screens/MainMenu';

type Screen = 'menu' | 'setup' | 'game' | 'history' | 'scoreboard' | 'rules';

interface AppProps {
  api?: GameApi;
  /** Injected so tests can decide the toss. */
  flipCoin?: () => CoinSide;
  tossDelayMs?: number;
}

export default function App({ api = defaultApi, flipCoin = flipFairCoin, tossDelayMs = 1100 }: AppProps) {
  const {
    game,
    scoreboard,
    history,
    isReady,
    isBusy,
    error,
    startGame,
    playCell,
    undo,
    resetGame,
    resetScoreboard,
    loadHistory,
    clearError,
    retry,
  } = useGame(api);
  const [screen, setScreen] = useState<Screen>('menu');
  const pageRef = useRef<HTMLDivElement>(null);
  const isFirstScreen = useRef(true);

  // Move focus to the new screen's heading so keyboard and screen reader users land in the right place.
  useEffect(() => {
    if (isFirstScreen.current) {
      isFirstScreen.current = false;
      return;
    }
    pageRef.current?.querySelector<HTMLElement>('h1')?.focus();
  }, [screen]);

  const go = (next: Screen) => {
    clearError();
    setScreen(next);
  };

  const handleStart = async (options: CreateGameRequest) => {
    if (await startGame(options)) setScreen('game');
  };

  const toMenu = () => go('menu');

  return (
    <div className="page" ref={pageRef}>
      {screen === 'menu' && (
        <>
          <MainMenu
            canContinue={game?.status === 'InProgress'}
            disabled={!isReady}
            onContinue={() => go('game')}
            onStart={() => go('setup')}
            onHistory={() => go('history')}
            onScoreboard={() => go('scoreboard')}
            onRules={() => go('rules')}
          />
          {error && (
            <div className="setup__error" role="alert">
              <p>{error}</p>
              <button type="button" className="button" onClick={() => void retry()} disabled={isBusy}>
                Try again
              </button>
            </div>
          )}
        </>
      )}

      {screen === 'setup' && (
        <GameSetup
          disabled={isBusy}
          error={error}
          flipCoin={flipCoin}
          tossDelayMs={tossDelayMs}
          onBack={toMenu}
          onStart={(options) => void handleStart(options)}
        />
      )}

      {screen === 'game' && game && (
        <GameScreen
          game={game}
          scoreboard={scoreboard}
          isBusy={isBusy}
          error={error}
          onPlay={playCell}
          onUndo={undo}
          onReset={resetGame}
          onNewGame={() => go('setup')}
          onResetScoreboard={resetScoreboard}
          onMenu={toMenu}
        />
      )}

      {screen === 'history' && <HistoryScreen history={history} error={error} onLoad={loadHistory} onBack={toMenu} />}

      {screen === 'scoreboard' && (
        <ScoreboardScreen
          scoreboard={scoreboard}
          isBusy={isBusy}
          error={error}
          onReset={resetScoreboard}
          onBack={toMenu}
        />
      )}

      {screen === 'rules' && <RulesScreen onBack={toMenu} />}
    </div>
  );
}
