// Campaign CRUD and launch, scoped to the caller's organisation.
//
// Creating a campaign resolves the chosen targets (by id or by group) and mints a
// unique, unguessable tracking token for each recipient — so a tracking URL never
// carries a name or email. Launching schedules one delayed send job per recipient
// so the mails trickle out at the configured drip rate.
import type { CampaignStatus, PrismaClient } from '@prisma/client';
import { AppError } from '../lib/http-error.js';
import { generateOpaqueToken } from '../lib/tokens.js';
import { getSendQueue } from '../lib/queue.js';
import { computeSendDelays } from './drip.js';

export type CampaignInput = {
  templateId: string;
  scheduledAt?: Date | null;
  dripPerMin?: number;
  targetIds?: string[];
  groups?: string[];
};

// A campaign may address at most this many targets in one run — a simple sending
// limit. Domain-ownership verification is added in a later phase.
const MAX_TARGETS_PER_CAMPAIGN = 1000;

export function createCampaignService(prisma: PrismaClient) {
  async function resolveTargetIds(orgId: string, input: CampaignInput): Promise<string[]> {
    const ids = new Set<string>();

    if (input.targetIds?.length) {
      const found = await prisma.target.findMany({
        where: { orgId, id: { in: input.targetIds } },
        select: { id: true },
      });
      found.forEach((t) => ids.add(t.id));
    }
    if (input.groups?.length) {
      const found = await prisma.target.findMany({
        where: { orgId, groups: { hasSome: input.groups } },
        select: { id: true },
      });
      found.forEach((t) => ids.add(t.id));
    }
    return [...ids];
  }

  return {
    async list(orgId: string) {
      return prisma.campaign.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        include: {
          template: { select: { name: true, locale: true } },
          _count: { select: { targets: true } },
        },
      });
    },

    async get(orgId: string, id: string) {
      const campaign = await prisma.campaign.findFirst({
        where: { id, orgId },
        include: { template: { select: { name: true, locale: true } } },
      });
      if (!campaign) throw new AppError(404, 'not_found', 'Campaign not found');
      const total = await prisma.campaignTarget.count({ where: { campaignId: id } });
      const sent = await prisma.campaignTarget.count({
        where: { campaignId: id, sentAt: { not: null } },
      });
      return { ...campaign, stats: { total, sent } };
    },

    async create(orgId: string, input: CampaignInput) {
      const template = await prisma.emailTemplate.findFirst({
        where: { id: input.templateId, orgId },
        select: { id: true },
      });
      if (!template) throw new AppError(400, 'bad_template', 'Template not found');

      const targetIds = await resolveTargetIds(orgId, input);
      if (targetIds.length === 0) {
        throw new AppError(400, 'no_targets', 'Select at least one valid target');
      }
      if (targetIds.length > MAX_TARGETS_PER_CAMPAIGN) {
        throw new AppError(
          400,
          'too_many_targets',
          `A campaign may address at most ${MAX_TARGETS_PER_CAMPAIGN} targets`,
        );
      }

      return prisma.$transaction(async (tx) => {
        const campaign = await tx.campaign.create({
          data: {
            orgId,
            templateId: input.templateId,
            scheduledAt: input.scheduledAt ?? null,
            dripPerMin: input.dripPerMin ?? 20,
            status: 'draft',
          },
        });
        await tx.campaignTarget.createMany({
          data: targetIds.map((targetId) => ({
            campaignId: campaign.id,
            targetId,
            token: generateOpaqueToken(),
          })),
        });
        return { ...campaign, targetCount: targetIds.length };
      });
    },

    async launch(orgId: string, id: string) {
      const campaign = await prisma.campaign.findFirst({ where: { id, orgId } });
      if (!campaign) throw new AppError(404, 'not_found', 'Campaign not found');
      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        throw new AppError(409, 'already_launched', 'Campaign has already been launched');
      }

      // Only recipients that have not been sent to yet.
      const pending = await prisma.campaignTarget.findMany({
        where: { campaignId: id, sentAt: null },
        select: { id: true },
      });
      if (pending.length === 0) throw new AppError(400, 'no_targets', 'Campaign has no recipients');

      const startAt =
        campaign.scheduledAt && campaign.scheduledAt > new Date()
          ? campaign.scheduledAt
          : new Date();
      const delays = computeSendDelays({
        count: pending.length,
        dripPerMin: campaign.dripPerMin,
        startAt,
      });

      const queue = getSendQueue();
      await Promise.all(
        pending.map((ct, i) =>
          queue.add(
            'send',
            { campaignTargetId: ct.id },
            // jobId keyed on the recipient makes re-launching idempotent.
            {
              delay: delays[i] ?? 0,
              jobId: `send-${ct.id}`,
              removeOnComplete: true,
              removeOnFail: false,
            },
          ),
        ),
      );

      const status: CampaignStatus = startAt > new Date() ? 'scheduled' : 'sending';
      await prisma.campaign.update({ where: { id }, data: { status } });
      return { enqueued: pending.length, status };
    },

    async remove(orgId: string, id: string) {
      const campaign = await prisma.campaign.findFirst({ where: { id, orgId } });
      if (!campaign) throw new AppError(404, 'not_found', 'Campaign not found');
      if (campaign.status === 'sending') {
        throw new AppError(409, 'in_progress', 'Cannot delete a campaign while it is sending');
      }
      await prisma.campaign.delete({ where: { id } });
    },
  };
}
