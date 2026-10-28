import { request } from './client';
import type { CreateGameRequest, GameState, GameSummary, MoveRequest, Scoreboard } from './types';

/** Everything the UI needs from the backend. The HTTP client and the mock both implement it. */
export interface GameApi {
  createGame(options: CreateGameRequest): Promise<GameState>;
  getGame(gameId: string): Promise<GameState>;
  makeMove(gameId: string, move: MoveRequest): Promise<GameState>;
  undoMove(gameId: string): Promise<GameState>;
  resetGame(gameId: string): Promise<GameState>;
  getHistory(): Promise<GameSummary[]>;
  getScoreboard(): Promise<Scoreboard>;
  resetScoreboard(): Promise<Scoreboard>;
}

const gamePath = (gameId: string) => `/games/${encodeURIComponent(gameId)}`;

export const httpGameApi: GameApi = {
  createGame: (options) =>
    request<GameState>('/games', { method: 'POST', body: JSON.stringify(options) }),

  getGame: (gameId) => request<GameState>(gamePath(gameId)),

  makeMove: (gameId, move) =>
    request<GameState>(`${gamePath(gameId)}/moves`, {
      method: 'POST',
      body: JSON.stringify({ player: move.player, row: move.row, column: move.column }),
    }),

  undoMove: (gameId) => request<GameState>(`${gamePath(gameId)}/undo`, { method: 'POST' }),

  resetGame: (gameId) => request<GameState>(`${gamePath(gameId)}/reset`, { method: 'POST' }),

  getHistory: () => request<GameSummary[]>('/history'),

  getScoreboard: () => request<Scoreboard>('/scoreboard'),

  resetScoreboard: () => request<Scoreboard>('/scoreboard/reset', { method: 'POST' }),
};
