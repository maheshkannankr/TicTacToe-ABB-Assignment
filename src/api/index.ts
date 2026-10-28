import { httpGameApi, type GameApi } from './gameApi';
import { createMockGameApi } from '../mocks/mockGameApi';

// No backend ships with this repo, so the app runs against an in-browser fake API by default.
// `npm run dev:api` / `npm run build:api` set VITE_USE_MOCK=false (see .env.api) to call the real API.
export const gameApi: GameApi =
  import.meta.env.VITE_USE_MOCK === 'false' ? httpGameApi : createMockGameApi({ latencyMs: 120 });

export type { GameApi } from './gameApi';
export { ApiError } from './client';
