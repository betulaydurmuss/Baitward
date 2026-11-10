// Account-lockout policy, kept pure so it is easy to reason about and test.
// After MAX_FAILED consecutive wrong passwords the account is locked for
// LOCK_MINUTES; while locked, sign-in is refused without even checking the password.
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export type LockState = {
  failedLogins: number;
  lockedUntil: Date | null;
};

export function isLocked(lockedUntil: Date | null, now: Date = new Date()): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime();
}

// Given the current failure count, returns the state to persist after one more
// failure. On reaching the threshold the account locks and the counter resets, so
// a fresh run of attempts is available once the lock expires.
export function registerFailure(currentFailed: number, now: Date = new Date()): LockState {
  const next = currentFailed + 1;
  if (next >= MAX_FAILED_ATTEMPTS) {
    return { failedLogins: 0, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000) };
  }
  return { failedLogins: next, lockedUntil: null };
}

// State to persist after a successful sign-in: the slate is wiped clean.
export function clearedState(): LockState {
  return { failedLogins: 0, lockedUntil: null };
}
