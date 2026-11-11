// Admin operations, scoped to the caller's organisation: managing users, reading
// system health, the audit log, and plan limits. Every change writes an audit entry.
import type { PrismaClient } from '@prisma/client';
import { AppError } from '../lib/http-error.js';
import { writeAudit } from '../lib/audit.js';
import { generateOpaqueToken, sha256 } from '../lib/tokens.js';
import { getSendQueue } from '../lib/queue.js';

type Actor = { actorId: string; ip?: string };

export function createAdminService(prisma: PrismaClient) {
  const userView = {
    id: true,
    email: true,
    role: true,
    totpEnabled: true,
    failedLogins: true,
    lockedUntil: true,
    suspendedAt: true,
    createdAt: true,
  } as const;

  async function requireUserInOrg(orgId: string, id: string) {
    const user = await prisma.user.findFirst({ where: { id, orgId }, select: userView });
    if (!user) throw new AppError(404, 'not_found', 'User not found');
    return user;
  }

  return {
    listUsers(orgId: string, q?: string) {
      return prisma.user.findMany({
        where: { orgId, ...(q ? { email: { contains: q, mode: 'insensitive' } } : {}) },
        select: userView,
        orderBy: { createdAt: 'asc' },
      });
    },

    async setSuspended(orgId: string, id: string, suspended: boolean, actor: Actor) {
      const user = await requireUserInOrg(orgId, id);
      if (user.id === actor.actorId && suspended) {
        throw new AppError(400, 'cannot_suspend_self', 'You cannot suspend your own account');
      }
      await prisma.$transaction([
        prisma.user.update({ where: { id }, data: { suspendedAt: suspended ? new Date() : null } }),
        // Suspending also signs the user out everywhere.
        ...(suspended
          ? [
              prisma.session.updateMany({
                where: { userId: id, revokedAt: null },
                data: { revokedAt: new Date() },
              }),
            ]
          : []),
      ]);
      await writeAudit(prisma, {
        orgId,
        actorId: actor.actorId,
        action: suspended ? 'user.suspend' : 'user.unsuspend',
        target: user.email,
        ip: actor.ip,
      });
      return { ok: true };
    },

    // Issues a reset token for a user. The token is returned so the caller can log a
    // dev link; in production it would be emailed.
    async sendPasswordReset(orgId: string, id: string, actor: Actor) {
      const user = await requireUserInOrg(orgId, id);
      const token = generateOpaqueToken();
      await prisma.user.update({
        where: { id },
        data: {
          resetTokenHash: sha256(token),
          resetTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
      await writeAudit(prisma, {
        orgId,
        actorId: actor.actorId,
        action: 'user.reset_sent',
        target: user.email,
        ip: actor.ip,
      });
      return { token, email: user.email };
    },

    async setMonthlyLimit(orgId: string, monthlySendLimit: number, actor: Actor) {
      await prisma.organization.update({ where: { id: orgId }, data: { monthlySendLimit } });
      await writeAudit(prisma, {
        orgId,
        actorId: actor.actorId,
        action: 'org.set_limit',
        target: String(monthlySendLimit),
        ip: actor.ip,
      });
      return { ok: true };
    },

    async getHealth(orgId: string) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [queue, sends24h, events24h, sending, org] = await Promise.all([
        getSendQueue().getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed'),
        prisma.campaignTarget.count({ where: { campaign: { orgId }, sentAt: { gte: since } } }),
        prisma.event.count({
          where: { campaignTarget: { campaign: { orgId } }, createdAt: { gte: since } },
        }),
        prisma.campaign.count({ where: { orgId, status: 'sending' } }),
        prisma.organization.findUniqueOrThrow({
          where: { id: orgId },
          select: { monthlySendLimit: true, verifiedDomain: true },
        }),
      ]);
      return {
        queue,
        last24h: { sends: sends24h, events: events24h },
        campaignsSending: sending,
        org,
      };
    },

    async getAuditLogs(orgId: string, limit = 100) {
      const logs = await prisma.auditLog.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      const actorIds = [...new Set(logs.map((l) => l.actorId).filter((x): x is string => !!x))];
      const actors = await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, email: true },
      });
      const emailById = new Map(actors.map((a) => [a.id, a.email]));
      return logs.map((l) => ({
        id: l.id,
        action: l.action,
        target: l.target,
        ip: l.ip,
        actor: l.actorId ? (emailById.get(l.actorId) ?? l.actorId) : null,
        createdAt: l.createdAt,
      }));
    },
  };
}
