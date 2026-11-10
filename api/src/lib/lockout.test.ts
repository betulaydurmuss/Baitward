import { describe, expect, it } from 'vitest';
import {
  LOCK_MINUTES,
  MAX_FAILED_ATTEMPTS,
  clearedState,
  isLocked,
  registerFailure,
} from './lockout.js';

describe('lockout policy', () => {
  it('counts up failures below the threshold without locking', () => {
    const state = registerFailure(2);
    expect(state.failedLogins).toBe(3);
    expect(state.lockedUntil).toBeNull();
  });

  it('locks on the fifth failure and resets the counter', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const state = registerFailure(MAX_FAILED_ATTEMPTS - 1, now);
    expect(state.failedLogins).toBe(0);
    expect(state.lockedUntil).toEqual(new Date(now.getTime() + LOCK_MINUTES * 60_000));
  });

  it('reports a lock as active until it expires', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const future = new Date(now.getTime() + 60_000);
    const past = new Date(now.getTime() - 60_000);
    expect(isLocked(future, now)).toBe(true);
    expect(isLocked(past, now)).toBe(false);
    expect(isLocked(null, now)).toBe(false);
  });

  it('clears state on success', () => {
    expect(clearedState()).toEqual({ failedLogins: 0, lockedUntil: null });
  });
});
