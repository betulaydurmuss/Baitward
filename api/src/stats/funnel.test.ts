import { describe, expect, it } from 'vitest';
import { computeFunnel } from './funnel.js';

describe('computeFunnel', () => {
  it('counts each recipient once per stage and dedupes repeat events', () => {
    const funnel = computeFunnel({
      total: 3,
      sent: 3,
      events: [
        { campaignTargetId: 'a', type: 'opened' },
        { campaignTargetId: 'a', type: 'opened' }, // duplicate open
        { campaignTargetId: 'a', type: 'clicked' },
        { campaignTargetId: 'b', type: 'opened' },
      ],
    });
    expect(funnel).toMatchObject({ total: 3, sent: 3, opened: 2, clicked: 1, submitted: 0 });
  });

  it('treats a click or submit as implying an open (monotonic funnel)', () => {
    const funnel = computeFunnel({
      total: 2,
      sent: 2,
      // "c" submitted but the open pixel never fired.
      events: [{ campaignTargetId: 'c', type: 'submitted' }],
    });
    expect(funnel.opened).toBe(1);
    expect(funnel.clicked).toBe(1);
    expect(funnel.submitted).toBe(1);
    // Funnel never widens as it deepens.
    expect(funnel.sent).toBeGreaterThanOrEqual(funnel.opened);
    expect(funnel.opened).toBeGreaterThanOrEqual(funnel.clicked);
    expect(funnel.clicked).toBeGreaterThanOrEqual(funnel.submitted);
  });

  it('counts reports separately', () => {
    const funnel = computeFunnel({
      total: 1,
      sent: 1,
      events: [{ campaignTargetId: 'd', type: 'reported' }],
    });
    expect(funnel.reported).toBe(1);
    expect(funnel.clicked).toBe(0);
  });
});
