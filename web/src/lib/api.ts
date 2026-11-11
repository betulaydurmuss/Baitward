// Thin API client. The access token lives only in memory (never localStorage, so
// it cannot be read by injected scripts); the refresh token is an httpOnly cookie
// the browser attaches automatically because every request uses credentials.
// When a call gets a 401 and we think we are logged in, it tries one silent
// refresh and retries.
const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000'}/api`;

let accessToken: string | null = null;
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

// These endpoints manage their own auth flow; a 401 from them is meaningful and
// must not trigger a refresh-and-retry.
const NO_REFRESH = new Set([
  '/auth/login',
  '/auth/refresh',
  '/auth/register',
  '/auth/2fa/verify',
  '/auth/forgot-password',
  '/auth/reset-password',
]);

type Options = { method?: string; body?: unknown; retry?: boolean };

async function request<T>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(BASE + path, {
    method: opts.method ?? 'GET',
    headers,
    credentials: 'include',
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && !opts.retry && !NO_REFRESH.has(path) && (await tryRefresh())) {
    return request<T>(path, { ...opts, retry: true });
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = data?.error ?? { code: 'error', message: 'Request failed' };
    throw new ApiError(err.code, err.message, res.status);
  }
  return data as T;
}

export async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string };
    accessToken = data.accessToken;
    return true;
  } catch {
    return false;
  }
}

// Fetches a binary file (e.g. a report PDF) with auth, retrying once after a
// silent refresh. Returns a Blob the caller can turn into a download.
async function getBlob(path: string): Promise<Blob> {
  const authHeaders = (): Record<string, string> =>
    accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  let res = await fetch(BASE + path, { headers: authHeaders(), credentials: 'include' });
  if (res.status === 401 && (await tryRefresh())) {
    res = await fetch(BASE + path, { headers: authHeaders(), credentials: 'include' });
  }
  if (!res.ok) throw new ApiError('download_failed', 'Download failed', res.status);
  return res.blob();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  blob: getBlob,
};
