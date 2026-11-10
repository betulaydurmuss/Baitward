// Token handling. Two very different tokens live here:
//
//  - Access token: a short-lived (15 min) signed JWT the browser sends in the
//    Authorization header. Stateless; never stored server-side.
//  - Refresh token: a long-lived (7 day) opaque random string kept in an httpOnly
//    cookie. Only its SHA-256 hash is stored, so a database leak cannot be replayed.
//
// A third, short pending token bridges the two-factor step between password and code.
import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../env.js';

export const ACCESS_TOKEN_TTL = '15m';
export const PENDING_TOKEN_TTL = '5m';
export const REFRESH_TOKEN_TTL_DAYS = 7;

export type AccessClaims = {
  sub: string; // user id
  org: string; // organisation id
  role: Role;
  typ: 'access';
};

// Purpose distinguishes "enter your code" from "enrol into 2FA before you may in".
export type PendingPurpose = 'twofactor' | 'enroll';

export type PendingClaims = {
  sub: string;
  purpose: PendingPurpose;
  typ: 'pending';
};

export function signAccessToken(input: { userId: string; orgId: string; role: Role }): string {
  const payload: AccessClaims = {
    sub: input.userId,
    org: input.orgId,
    role: input.role,
    typ: 'access',
  };
  return jwt.sign(payload, env.AUTH_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessClaims {
  const decoded = jwt.verify(token, env.AUTH_ACCESS_SECRET);
  if (typeof decoded === 'string' || decoded.typ !== 'access') {
    throw new Error('Not an access token');
  }
  return decoded as AccessClaims;
}

export function signPendingToken(userId: string, purpose: PendingPurpose): string {
  const payload: PendingClaims = { sub: userId, purpose, typ: 'pending' };
  return jwt.sign(payload, env.AUTH_ACCESS_SECRET, { expiresIn: PENDING_TOKEN_TTL });
}

export function verifyPendingToken(token: string): PendingClaims {
  const decoded = jwt.verify(token, env.AUTH_ACCESS_SECRET);
  if (typeof decoded === 'string' || decoded.typ !== 'pending') {
    throw new Error('Not a pending token');
  }
  return decoded as PendingClaims;
}

// A high-entropy opaque token; the plaintext goes to the client once, the hash to the db.
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
