import { type CSSProperties, useEffect, useRef, useState } from 'react';
import type { CreateGameRequest, Difficulty, GameMode, Player } from '../api/types';
import { ScreenHeader } from '../components/ScreenHeader';

export type CoinSide = 'Heads' | 'Tails';

export const flipFairCoin = (): CoinSide => (Math.random() < 0.5 ? 'Heads' : 'Tails');

/** Computer levels, weakest first. The server decides how each one plays; this is just the copy. */
const LEVELS: { difficulty: Difficulty; text: string }[] = [
  { difficulty: 'Novice', text: 'Plays any free cell' },
  { difficulty: 'Easy', text: 'Takes a win when it sees one' },
  { difficulty: 'Medium', text: 'Wins and blocks you' },
  { difficulty: 'Hard', text: 'Wins, blocks, then center and corners' },
  { difficulty: 'Unbeatable', text: 'Never loses. Aim for a draw' },
];

type Step = 'mode' | 'level' | 'toss' | 'side' | 'ready';
/** p1 is the human (single player) or Player 1, who calls the toss. p2 is the computer or Player 2. */
type Seat = 'p1' | 'p2';

const other = (player: Player): Player => (player === 'X' ? 'O' : 'X');

interface GameSetupProps {
  disabled: boolean;
  error: string | null;
  flipCoin: () => CoinSide;
  tossDelayMs: number;
  onBack: () => void;
  onStart: (options: CreateGameRequest) => void;
}

/** Start game flow: pick a mode, toss a coin, and the toss winner picks X or O. */
export function GameSetup({ disabled, error, flipCoin, tossDelayMs, onBack, onStart }: GameSetupProps) {
  const [step, setStep] = useState<Step>('mode');
  const [mode, setMode] = useState<GameMode>('Computer');
  const [difficulty, setDifficulty] = useState<Difficulty>('Hard');
  const [names, setNames] = useState<Record<Seat, string>>({ p1: '', p2: '' });
  const [call, setCall] = useState<CoinSide | null>(null);
  const [result, setResult] = useState<CoinSide | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [tossWinner, setTossWinner] = useState<Seat | null>(null);
  const [p1Side, setP1Side] = useState<Player | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const vsComputer = mode === 'Computer';
  const nameOf = (seat: Seat) => {
    if (vsComputer) return seat === 'p1' ? 'You' : 'Computer';
    return names[seat].trim() || (seat === 'p1' ? 'Player 1' : 'Player 2');
  };

  const chooseMode = (next: GameMode) => {
    setMode(next);
    setStep(next === 'Computer' ? 'level' : 'toss');
  };

  const chooseLevel = (next: Difficulty) => {
    setDifficulty(next);
    setStep('toss');
  };

  const restartToss = () => {
    window.clearTimeout(timer.current);
    setCall(null);
    setResult(null);
    setIsFlipping(false);
    setTossWinner(null);
    setP1Side(null);
    setStep('toss');
  };

  const callToss = (side: CoinSide) => {
    setCall(side);
    setResult(null);
    setIsFlipping(true);
    timer.current = window.setTimeout(() => {
      const landed = flipCoin();
      const winner: Seat = landed === side ? 'p1' : 'p2';
      setResult(landed);
      setIsFlipping(false);
      setTossWinner(winner);
      if (vsComputer && winner === 'p2') {
        // The computer always takes X, so it gets the first move.
        setP1Side('O');
        setStep('ready');
      } else {
        setStep('side');
      }
    }, tossDelayMs);
  };

  const skipToss = () => {
    setCall(null);
    setResult(null);
    setTossWinner('p1');
    setStep('side');
  };

  const chooseSide = (side: Player) => {
    setP1Side(tossWinner === 'p2' ? other(side) : side);
    setStep('ready');
  };

  const start = () => {
    if (!p1Side) return;
    const playerNames = { [p1Side]: nameOf('p1'), [other(p1Side)]: nameOf('p2') } as Record<Player, string>;
    onStart(
      vsComputer
        ? { mode: 'Computer', humanPlayer: p1Side, difficulty, playerNames }
        : { mode: 'TwoPlayer', playerNames },
    );
  };

  const goBack = () => {
    if (step === 'mode') onBack();
    else if (step === 'level') setStep('mode');
    else if (step === 'toss') setStep(vsComputer ? 'level' : 'mode');
    else restartToss();
  };

  const stepLabels = vsComputer ? ['Mode', 'Level', 'Toss', 'Side'] : ['Mode', 'Toss', 'Side'];
  const currentStep = stepLabels.indexOf(
    { mode: 'Mode', level: 'Level', toss: 'Toss', side: 'Side', ready: 'Side' }[step],
  );

  const tossMessage = () => {
    if (!tossWinner) return null;
    if (!result) return vsComputer ? 'Toss skipped.' : `Toss skipped. ${nameOf('p1')} picks a side.`;
    const landed = `It's ${result}!`;
    if (vsComputer) {
      return tossWinner === 'p1'
        ? `${landed} You won the toss.`
        : `${landed} The computer won the toss and chose X, so it moves first.`;
    }
    return `${landed} ${nameOf(tossWinner)} won the toss.`;
  };

  return (
    <>
      <ScreenHeader title="New game" backLabel={step === 'mode' ? 'Main menu' : 'Back'} onBack={goBack} />

      <main className="setup">
        <ol className="steps" aria-label="Setup steps">
          {stepLabels.map((label, index) => (
            <li
              key={label}
              className={
                index === currentStep ? 'steps__item is-current' : index < currentStep ? 'steps__item is-done' : 'steps__item'
              }
              aria-current={index === currentStep ? 'step' : undefined}
            >
              {label}
            </li>
          ))}
        </ol>

        {step === 'mode' && (
          <section className="setup__step" aria-labelledby="mode-heading">
            <h2 id="mode-heading">How do you want to play?</h2>
            <div className="choices">
              <button type="button" className="choice" onClick={() => chooseMode('Computer')}>
                <span className="choice__title">Single player</span>
                <span className="choice__text">You against the computer</span>
              </button>
              <button type="button" className="choice choice--pink" onClick={() => chooseMode('TwoPlayer')}>
                <span className="choice__title">Multiplayer</span>
                <span className="choice__text">Two players on this device</span>
              </button>
            </div>
          </section>
        )}

        {step === 'level' && (
          <section className="setup__step" aria-labelledby="level-heading">
            <h2 id="level-heading">Pick the computer's level</h2>
            <div className="levels">
              {LEVELS.map(({ difficulty: level, text }, index) => (
                <button
                  key={level}
                  type="button"
                  className={level === difficulty ? 'level is-selected' : 'level'}
                  style={{ '--level': index } as CSSProperties}
                  onClick={() => chooseLevel(level)}
                >
                  <span className="level__pips" aria-hidden="true">
                    {LEVELS.map((_, pip) => (
                      <span key={pip} className={pip <= index ? 'level__pip is-on' : 'level__pip'} />
                    ))}
                  </span>
                  <span className="level__name">
                    <span className="visually-hidden">Level {index + 1}: </span>
                    {level}
                  </span>
                  <span className="level__text">{text}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 'toss' && (
          <section className="setup__step" aria-labelledby="toss-heading">
            <h2 id="toss-heading">Coin toss</h2>

            {!vsComputer && (
              <div className="names">
                <label className="field">
                  <span>Player 1 name</span>
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="Player 1"
                    value={names.p1}
                    disabled={isFlipping}
                    onChange={(event) => setNames({ ...names, p1: event.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Player 2 name</span>
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="Player 2"
                    value={names.p2}
                    disabled={isFlipping}
                    onChange={(event) => setNames({ ...names, p2: event.target.value })}
                  />
                </label>
              </div>
            )}

            <p className="setup__lead">
              {vsComputer ? 'Call it in the air.' : `${nameOf('p1')}, call it in the air.`} The winner picks X or O,
              and X moves first.
            </p>

            <Coin face={isFlipping ? null : result} spinning={isFlipping} />

            <div className="choices choices--compact">
              {(['Heads', 'Tails'] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  className={side === 'Heads' ? 'choice' : 'choice choice--pink'}
                  disabled={isFlipping}
                  onClick={() => callToss(side)}
                >
                  <span className="choice__title">{side}</span>
                </button>
              ))}
            </div>

            <p className="setup__flip" aria-live="polite">
              {isFlipping && call && `${vsComputer ? 'You' : nameOf('p1')} called ${call}. Flipping…`}
            </p>

            <button type="button" className="link-button link-button--quiet" onClick={skipToss} disabled={isFlipping}>
              Skip the toss
            </button>
          </section>
        )}

        {step === 'side' && tossWinner && (
          <section className="setup__step" aria-labelledby="side-heading">
            {result && <Coin face={result} spinning={false} />}
            <p className="setup__result" role="status">
              {tossMessage()}
            </p>
            <h2 id="side-heading">
              {vsComputer ? 'Pick your side' : `${nameOf(tossWinner)}, pick your side`}
            </h2>
            <div className="choices">
              <button type="button" className="choice choice--side" onClick={() => chooseSide('X')}>
                <span className="choice__mark choice__mark--x" aria-hidden="true">
                  X
                </span>
                <span className="choice__title">Play X</span>
                <span className="choice__text">Moves first</span>
              </button>
              <button type="button" className="choice choice--side choice--pink" onClick={() => chooseSide('O')}>
                <span className="choice__mark choice__mark--o" aria-hidden="true">
                  O
                </span>
                <span className="choice__title">Play O</span>
                <span className="choice__text">Moves second</span>
              </button>
            </div>
          </section>
        )}

        {step === 'ready' && p1Side && (
          <section className="setup__step" aria-labelledby="ready-heading">
            {result && <Coin face={result} spinning={false} />}
            <p className="setup__result" role="status">
              {tossMessage()}
            </p>
            <h2 id="ready-heading">Ready to play</h2>
            <ul className="lineup">
              {(p1Side === 'X' ? (['p1', 'p2'] as const) : (['p2', 'p1'] as const)).map((seat) => {
                const side = seat === 'p1' ? p1Side : other(p1Side);
                const isYou = vsComputer && seat === 'p1';
                return (
                  <li key={seat} className={`lineup__row lineup__row--${side.toLowerCase()}`}>
                    <span className="lineup__mark" aria-hidden="true">
                      {side}
                    </span>
                    <span>
                      {nameOf(seat)} {isYou ? 'play' : 'plays'} {side}
                      {side === 'X' && (isYou ? ' and move first' : ' and moves first')}
                    </span>
                  </li>
                );
              })}
            </ul>
            {vsComputer && (
              <p className="setup__lead">
                Computer level: <strong>{difficulty}</strong>
              </p>
            )}
            <div className="controls__buttons">
              <button type="button" className="button button--big" onClick={start} disabled={disabled}>
                Start game
              </button>
              <button type="button" className="button button--pink" onClick={restartToss} disabled={disabled}>
                Toss again
              </button>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </section>
        )}
      </main>
    </>
  );
}

function Coin({ face, spinning }: { face: CoinSide | null; spinning: boolean }) {
  return (
    <div className={spinning ? 'coin is-spinning' : 'coin'} aria-hidden="true">
      <span className="coin__face">{face ? face[0] : '?'}</span>
      {face && <span className="coin__label">{face}</span>}
    </div>
  );
}
