// Turns a campaign's raw events into funnel counts. Computed as a proper funnel:
// each later stage counts a recipient only if they reached at least that far, so the
// numbers never increase down the funnel even if, say, an open pixel was blocked but
// the click still registered.
import type { EventType } from '@prisma/client';

export type FunnelCounts = {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  submitted: number;
  reported: number;
  trained: number;
};

export function computeFunnel(input: {
  total: number;
  sent: number;
  events: { campaignTargetId: string; type: EventType }[];
}): FunnelCounts {
  const byType = new Map<EventType, Set<string>>();
  for (const e of input.events) {
    let set = byType.get(e.type);
    if (!set) {
      set = new Set<string>();
      byType.set(e.type, set);
    }
    set.add(e.campaignTargetId);
  }

  const setOf = (t: EventType): Set<string> => byType.get(t) ?? new Set<string>();
  const unionSize = (...types: EventType[]): number => {
    const all = new Set<string>();
    for (const t of types) setOf(t).forEach((id) => all.add(id));
    return all.size;
  };

  return {
    total: input.total,
    sent: input.sent,
    // A click (or submit) implies the mail was opened, even if the pixel never loaded.
    opened: unionSize('opened', 'clicked', 'submitted'),
    clicked: unionSize('clicked', 'submitted'),
    submitted: setOf('submitted').size,
    reported: setOf('reported').size,
    trained: setOf('trained').size,
  };
}
