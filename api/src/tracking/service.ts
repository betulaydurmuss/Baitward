// Records tracking events against a recipient identified only by their opaque
// token. The most important rule lives here: when a fake form is submitted, the
// submitted content is never read or stored — only that a `submitted` event
// happened, plus technical metadata (ip, user agent).
import type { EventType, PrismaClient } from '@prisma/client';

export type EventMeta = { ip?: string; userAgent?: string };

export function createTrackingService(prisma: PrismaClient) {
  // Records an event for a token at most once per type, so a mail client that loads
  // the open pixel twice does not count as two opens.
  async function recordOnce(token: string, type: EventType, meta: EventMeta): Promise<void> {
    const ct = await prisma.campaignTarget.findUnique({ where: { token }, select: { id: true } });
    if (!ct) return; // unknown token — ignore quietly

    const existing = await prisma.event.findFirst({
      where: { campaignTargetId: ct.id, type },
      select: { id: true },
    });
    if (existing) return;

    await prisma.event.create({
      data: { campaignTargetId: ct.id, type, ip: meta.ip, userAgent: meta.userAgent },
    });
  }

  return {
    recordOpen: (token: string, meta: EventMeta) => recordOnce(token, 'opened', meta),

    async recordClick(token: string, meta: EventMeta) {
      // A click means the mail was necessarily opened too.
      await recordOnce(token, 'opened', meta);
      await recordOnce(token, 'clicked', meta);
    },

    async recordSubmit(token: string, meta: EventMeta) {
      // Note: the submitted form body is deliberately NOT passed in and NOT stored.
      await recordOnce(token, 'opened', meta);
      await recordOnce(token, 'clicked', meta);
      await recordOnce(token, 'submitted', meta);
    },

    recordReport: (token: string, meta: EventMeta) => recordOnce(token, 'reported', meta),
  };
}
