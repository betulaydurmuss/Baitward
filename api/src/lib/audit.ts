// Writes an append-only audit entry. Called from every admin action and from
// campaign launches, so there is always a record of who did what, when and from where.
import type { PrismaClient } from '@prisma/client';

export type AuditEntry = {
  orgId: string;
  actorId?: string;
  action: string;
  target?: string;
  ip?: string;
};

export function writeAudit(prisma: PrismaClient, entry: AuditEntry): Promise<unknown> {
  return prisma.auditLog.create({ data: entry });
}
