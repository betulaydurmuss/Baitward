// Computes current human-risk scores for an organisation, per target and per
// department, from the behaviours recorded across all their campaigns.
import type { EventType, PrismaClient } from '@prisma/client';
import { averageScore, riskBand, scoreFromEventTypes } from './score.js';

export function createRiskService(prisma: PrismaClient) {
  return {
    async getScores(orgId: string) {
      const rows = await prisma.campaignTarget.findMany({
        where: { campaign: { orgId } },
        select: {
          targetId: true,
          target: { select: { email: true, department: true } },
          events: { select: { type: true } },
        },
      });

      // Collect every distinct behaviour per target, across their campaigns.
      const perTarget = new Map<
        string,
        { email: string; department: string; types: Set<EventType> }
      >();
      for (const row of rows) {
        const entry = perTarget.get(row.targetId) ?? {
          email: row.target.email,
          department: row.target.department || 'Unknown',
          types: new Set<EventType>(),
        };
        row.events.forEach((e) => entry.types.add(e.type));
        perTarget.set(row.targetId, entry);
      }

      const byTarget = [...perTarget.entries()].map(([targetId, v]) => {
        const score = scoreFromEventTypes(v.types);
        return { targetId, email: v.email, department: v.department, score, band: riskBand(score) };
      });
      byTarget.sort((a, b) => b.score - a.score);

      const deptScores = new Map<string, number[]>();
      for (const t of byTarget) {
        const list = deptScores.get(t.department) ?? [];
        list.push(t.score);
        deptScores.set(t.department, list);
      }
      const byDepartment = [...deptScores.entries()]
        .map(([department, scores]) => {
          const score = averageScore(scores);
          return { department, score, band: riskBand(score), count: scores.length };
        })
        .sort((a, b) => b.score - a.score);

      return { byTarget, byDepartment };
    },
  };
}
