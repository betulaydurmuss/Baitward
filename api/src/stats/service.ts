// Read-only aggregation for the dashboard and campaign detail views. Everything is
// scoped to the caller's organisation.
import type { PrismaClient } from '@prisma/client';
import { AppError } from '../lib/http-error.js';
import { computeFunnel } from './funnel.js';

export function createStatsService(prisma: PrismaClient) {
  async function campaignFunnel(campaignId: string) {
    const [total, sent, events] = await Promise.all([
      prisma.campaignTarget.count({ where: { campaignId } }),
      prisma.campaignTarget.count({ where: { campaignId, sentAt: { not: null } } }),
      prisma.event.findMany({
        where: { campaignTarget: { campaignId } },
        select: { campaignTargetId: true, type: true },
      }),
    ]);
    return computeFunnel({ total, sent, events });
  }

  return {
    async getCampaignStats(orgId: string, campaignId: string) {
      const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, orgId },
        include: { template: { select: { name: true, locale: true } } },
      });
      if (!campaign) throw new AppError(404, 'not_found', 'Campaign not found');

      const funnel = await campaignFunnel(campaignId);

      // Per-department breakdown: how far each department's recipients got.
      const rows = await prisma.campaignTarget.findMany({
        where: { campaignId },
        select: {
          sentAt: true,
          target: { select: { department: true } },
          events: { select: { type: true } },
        },
      });

      const deptMap = new Map<
        string,
        { total: number; sent: number; clicked: number; submitted: number }
      >();
      for (const row of rows) {
        const dept = row.target.department || 'Unknown';
        const entry = deptMap.get(dept) ?? { total: 0, sent: 0, clicked: 0, submitted: 0 };
        entry.total += 1;
        if (row.sentAt) entry.sent += 1;
        const types = new Set(row.events.map((e) => e.type));
        if (types.has('clicked') || types.has('submitted')) entry.clicked += 1;
        if (types.has('submitted')) entry.submitted += 1;
        deptMap.set(dept, entry);
      }
      const byDepartment = [...deptMap.entries()]
        .map(([department, v]) => ({ department, ...v }))
        .sort((a, b) => b.submitted - a.submitted || b.clicked - a.clicked);

      return {
        campaign: { id: campaign.id, status: campaign.status, template: campaign.template },
        funnel,
        byDepartment,
      };
    },

    async getOverview(orgId: string) {
      const [campaigns, targets, templates, recent] = await Promise.all([
        prisma.campaign.count({ where: { orgId } }),
        prisma.target.count({ where: { orgId } }),
        prisma.emailTemplate.count({ where: { orgId } }),
        prisma.campaign.findMany({
          where: { orgId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { template: { select: { name: true } } },
        }),
      ]);

      const recentCampaigns = await Promise.all(
        recent.map(async (c) => ({
          id: c.id,
          templateName: c.template.name,
          status: c.status,
          funnel: await campaignFunnel(c.id),
        })),
      );

      return { counts: { campaigns, targets, templates }, recentCampaigns };
    },
  };
}
