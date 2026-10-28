import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';
import type { GameApi } from '../api/gameApi';
import type { CellPosition, CreateGameRequest, GameState, GameSummary, Scoreboard } from '../api/types';

const GAME_ID_KEY = 'tic-tac-toe.gameId';

function saveGameId(gameId: string) {
  try {
    sessionStorage.setItem(GAME_ID_KEY, gameId);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). Resuming is a nicety, not a requirement.
  }
}

function readGameId(): string | null {
  try {
    return sessionStorage.getItem(GAME_ID_KEY);
  } catch {
    return null;
  }
}

/** A request for a fresh game with the same mode, sides, level and names. */
const sameSetup = (game: GameState): CreateGameRequest => ({
  mode: game.mode,
  humanPlayer: game.humanPlayer ?? undefined,
  difficulty: game.difficulty ?? undefined,
  playerNames: game.playerNames,
});

/** Picks up the game from before a page refresh, if the server still has it. */
async function resumeGame(api: GameApi): Promise<GameState | null> {
  const gameId = readGameId();
  if (!gameId) return null;
  try {
    return await api.getGame(gameId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/**
 * Owns all game, scoreboard and history state on the client. The server is the source of truth:
 * every action sends one request and renders exactly the state the server returns.
 */
export function useGame(api: GameApi) {
  const [game, setGame] = useState<GameState | null>(null);
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);
  const [history, setHistory] = useState<GameSummary[] | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A ref (not state) so rapid double-clicks are rejected before React re-renders.
  const busyRef = useRef(false);
  const startedRef = useRef(false);

  /** Runs one server action at a time. Resolves to true if it succeeded. */
  const run = useCallback(async (task: () => Promise<void>) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setIsBusy(true);
    setError(null);
    try {
      await task();
      return true;
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Something went wrong. Try again.');
      return false;
    } finally {
      busyRef.current = false;
      setIsBusy(false);
    }
  }, []);

  const showGame = useCallback((next: GameState) => {
    setGame(next);
    saveGameId(next.id);
  }, []);

  const refreshScoreboard = useCallback(async () => {
    setScoreboard(await api.getScoreboard());
  }, [api]);

  const load = useCallback(
    () =>
      run(async () => {
        const [currentScores, resumed] = await Promise.all([api.getScoreboard(), resumeGame(api)]);
        setScoreboard(currentScores);
        if (resumed) setGame(resumed);
        setIsReady(true);
      }),
    [api, run],
  );

  useEffect(() => {
    // Guard against StrictMode's double effect so we don't load twice on startup.
    if (startedRef.current) return;
    startedRef.current = true;
    void load();
  }, [load]);

  const startGame = useCallback(
    (options: CreateGameRequest) =>
      run(async () => showGame(await api.createGame(options))),
    [api, run, showGame],
  );

  const playCell = useCallback(
    (cell: CellPosition) => {
      if (!game || game.status !== 'InProgress' || game.board[cell.row][cell.column] !== null) return;
      void run(async () => {
        const next = await api.makeMove(game.id, { player: game.currentPlayer, ...cell });
        showGame(next);
        if (next.status !== 'InProgress') await refreshScoreboard();
      });
    },
    [api, game, refreshScoreboard, run, showGame],
  );

  const undo = useCallback(() => {
    // The server sets canUndo, and turns it off once a game is finished (Option A).
    if (!game?.canUndo) return;
    void run(async () => showGame(await api.undoMove(game.id)));
  }, [api, game, run, showGame]);

  const resetGame = useCallback(() => {
    if (!game) return;
    void run(async () => {
      try {
        showGame(await api.resetGame(game.id));
      } catch (error) {
        // The server may have restarted and forgotten this game; start a new one with the same setup.
        if (!(error instanceof ApiError && error.status === 404)) throw error;
        showGame(await api.createGame(sameSetup(game)));
      }
    });
  }, [api, game, run, showGame]);

  /** Starts a fresh game with the current setup. Works whether or not the current game is over. */
  const newGame = useCallback(() => {
    if (!game) return;
    void run(async () => showGame(await api.createGame(sameSetup(game))));
  }, [api, game, run, showGame]);

  const resetScoreboard = useCallback(() => {
    void run(async () => setScoreboard(await api.resetScoreboard()));
  }, [api, run]);

  const loadHistory = useCallback(() => {
    void run(async () => setHistory(await api.getHistory()));
  }, [api, run]);

  const clearError = useCallback(() => setError(null), []);

  return {
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
    newGame,
    resetScoreboard,
    loadHistory,
    clearError,
    retry: load,
  };
}
