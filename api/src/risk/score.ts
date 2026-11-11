// Human-risk scoring. Each behaviour carries a weight; positive behaviours
// (reporting, completing training) pull the score down. The result is clamped to
// 0–100, where higher means more at risk. Pure and easy to test.
import type { EventType } from '@prisma/client';

export const EVENT_WEIGHTS: Record<EventType, number> = {
  sent: 0,
  opened: 5,
  clicked: 15,
  submitted: 40,
  reported: -20, // spotting and reporting is the best outcome
  trained: -10,
};

// A person's score from the distinct behaviours they showed (each counts once).
export function scoreFromEventTypes(types: Iterable<EventType>): number {
  const seen = new Set<EventType>();
  let raw = 0;
  for (const t of types) {
    if (!seen.has(t)) {
      seen.add(t);
      raw += EVENT_WEIGHTS[t];
    }
  }
  return Math.max(0, Math.min(100, raw));
}

export type RiskBand = 'low' | 'medium' | 'high';

export function riskBand(score: number): RiskBand {
  if (score >= 40) return 'high';
  if (score >= 15) return 'medium';
  return 'low';
}

export function averageScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
