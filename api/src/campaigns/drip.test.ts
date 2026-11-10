import { describe, expect, it } from 'vitest';
import { computeSendDelays } from './drip.js';

describe('computeSendDelays', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  it('spaces sends by the drip interval (no jitter)', () => {
    const delays = computeSendDelays({
      count: 3,
      dripPerMin: 60, // one per second
      startAt: now,
      now,
      rand: () => 0,
    });
    expect(delays).toEqual([0, 1000, 2000]);
  });

  it('offsets every send by the time until a future start', () => {
    const startAt = new Date(now.getTime() + 60_000);
    const delays = computeSendDelays({ count: 2, dripPerMin: 60, startAt, now, rand: () => 0 });
    expect(delays).toEqual([60_000, 61_000]);
  });

  it('keeps jitter within one interval', () => {
    const delays = computeSendDelays({
      count: 2,
      dripPerMin: 60,
      startAt: now,
      now,
      rand: () => 0.999,
    });
    expect(delays[0]).toBeGreaterThanOrEqual(0);
    expect(delays[0]).toBeLessThan(1000);
    expect(delays[1]).toBeGreaterThanOrEqual(1000);
    expect(delays[1]).toBeLessThan(2000);
  });
});
