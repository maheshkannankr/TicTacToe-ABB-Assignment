export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

/**
 * Thin fetch wrapper: JSON in, JSON out, and every failure becomes an ApiError
 * whose message is safe to show to the player.
 */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  } catch {
    throw new ApiError("Can't reach the game server. Check that the API is running, then try again.", 0);
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** Reads ASP.NET Core ProblemDetails (`detail` / `title`) or a plain `{ message }` body. */
async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `The server returned an error (${response.status}). Try again.`;
  try {
    const body = (await response.json()) as { detail?: string; title?: string; message?: string };
    return body.detail ?? body.message ?? body.title ?? fallback;
  } catch {
    return fallback;
  }
}
