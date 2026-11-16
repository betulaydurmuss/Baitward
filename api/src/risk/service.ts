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

    // Behavioural insights across campaigns: who keeps falling for simulations
    // (repeat offenders, a coaching signal) and who keeps reporting them (the most
    // positive behaviour, worth recognising). Counted per distinct campaign.
    async getInsights(orgId: string) {
      const rows = await prisma.campaignTarget.findMany({
        where: { campaign: { orgId } },
        select: {
          targetId: true,
          target: { select: { email: true, department: true } },
          events: { select: { type: true } },
        },
      });

      const agg = new Map<
        string,
        {
          email: string;
          department: string;
          failures: number;
          reports: number;
          simulations: number;
        }
      >();
      for (const r of rows) {
        const e = agg.get(r.targetId) ?? {
          email: r.target.email,
          department: r.target.department || 'Unknown',
          failures: 0,
          reports: 0,
          simulations: 0,
        };
        e.simulations += 1;
        const types = new Set(r.events.map((x) => x.type));
        if (types.has('clicked') || types.has('submitted')) e.failures += 1;
        if (types.has('reported')) e.reports += 1;
        agg.set(r.targetId, e);
      }

      const all = [...agg.entries()].map(([targetId, v]) => ({ targetId, ...v }));
      const repeatOffenders = all
        .filter((x) => x.failures >= 2)
        .sort((a, b) => b.failures - a.failures || b.simulations - a.simulations)
        .slice(0, 20);
      const topReporters = all
        .filter((x) => x.reports >= 1)
        .sort((a, b) => b.reports - a.reports)
        .slice(0, 20);
      return { repeatOffenders, topReporters };
    },
  };
}
