import { describe, expect, it } from 'vitest';
import {
  generateOpaqueToken,
  sha256,
  signAccessToken,
  signPendingToken,
  verifyAccessToken,
  verifyPendingToken,
} from './tokens.js';

describe('access tokens', () => {
  it('signs and verifies, carrying user, org and role', () => {
    const token = signAccessToken({ userId: 'u1', orgId: 'o1', role: 'org_admin' });
    const claims = verifyAccessToken(token);
    expect(claims.sub).toBe('u1');
    expect(claims.org).toBe('o1');
    expect(claims.role).toBe('org_admin');
  });

  it('does not accept a pending token where an access token is required', () => {
    const pending = signPendingToken('u1', 'twofactor');
    expect(() => verifyAccessToken(pending)).toThrow();
  });
});

describe('pending tokens', () => {
  it('round-trips the purpose', () => {
    const claims = verifyPendingToken(signPendingToken('u1', 'enroll'));
    expect(claims.purpose).toBe('enroll');
  });

  it('rejects an access token', () => {
    const access = signAccessToken({ userId: 'u1', orgId: 'o1', role: 'org_admin' });
    expect(() => verifyPendingToken(access)).toThrow();
  });
});

describe('opaque tokens and hashing', () => {
  it('generates unique tokens and a stable hash', () => {
    expect(generateOpaqueToken()).not.toBe(generateOpaqueToken());
    expect(sha256('abc')).toBe(sha256('abc'));
    expect(sha256('abc')).not.toBe(sha256('abd'));
  });
});
