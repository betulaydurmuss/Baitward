// Gathers everything a campaign report shows, reusing the same funnel computation
// the dashboard uses so the numbers always agree.
import type { PrismaClient } from '@prisma/client';
import { createStatsService } from '../stats/service.js';
import type { FunnelCounts } from '../stats/funnel.js';

export type ReportData = {
  orgName: string;
  campaignName: string;
  status: string;
  funnel: FunnelCounts;
  byDepartment: {
    department: string;
    total: number;
    sent: number;
    clicked: number;
    submitted: number;
  }[];
  trainedCount: number;
  generatedAt: Date;
};

export async function buildCampaignReportData(
  prisma: PrismaClient,
  orgId: string,
  campaignId: string,
): Promise<ReportData> {
  const stats = createStatsService(prisma);
  const s = await stats.getCampaignStats(orgId, campaignId); // 404s if not in this org

  const [org, trainedCount] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: orgId }, select: { name: true } }),
    prisma.trainingCompletion.count({ where: { campaignTarget: { campaignId } } }),
  ]);

  return {
    orgName: org.name,
    campaignName: s.campaign.template?.name ?? 'Campaign',
    status: s.campaign.status,
    funnel: s.funnel,
    byDepartment: s.byDepartment,
    trainedCount,
    generatedAt: new Date(),
  };
}
