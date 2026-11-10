// Helpers for reading request metadata and for the refresh-token cookie.
//
// The cookie is httpOnly (JavaScript cannot read it), SameSite=Strict (not sent on
// cross-site requests, which blocks CSRF against the refresh endpoint) and scoped
// to /api/auth so it travels only where it is needed.
import type { Request, Response } from 'express';
import { COOKIE_SECURE } from '../env.js';
import { REFRESH_TOKEN_TTL_DAYS } from './tokens.js';

export const REFRESH_COOKIE_NAME = 'bw_refresh';
const COOKIE_PATH = '/api/auth';

export function getClientIp(req: Request): string | undefined {
  return req.ip;
}

export function getUserAgent(req: Request): string | undefined {
  return req.get('user-agent') ?? undefined;
}

export function getRefreshCookie(req: Request): string | undefined {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  return cookies?.[REFRESH_COOKIE_NAME];
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'strict',
    path: COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: COOKIE_PATH });
}
