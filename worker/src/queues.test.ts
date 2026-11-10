import { describe, expect, it } from 'vitest';
import { QUEUE_NAMES } from './queues.js';

describe('queue names', () => {
  it('exposes stable names shared with the API', () => {
    expect(QUEUE_NAMES.send).toBe('send');
    expect(QUEUE_NAMES.schedule).toBe('schedule');
  });
});
