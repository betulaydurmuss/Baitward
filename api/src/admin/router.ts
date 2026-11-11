// Admin-only routes. requireRole gates the whole router to administrators; a
// security_analyst or anyone else gets 403.
import { Router } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { createAdminService } from './service.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/async-handler.js';
import { AppError } from '../lib/http-error.js';
import { getClientIp } from '../lib/request.js';
import { env } from '../env.js';

export function createAdminRouter(prisma: PrismaClient): Router {
  const service = createAdminService(prisma);
  const router = Router();
  router.use(requireAuth, requireRole('org_admin', 'super_admin'));

  const actor = (req: { auth?: { userId: string } } & Parameters<typeof getClientIp>[0]) => ({
    actorId: req.auth!.userId,
    ip: getClientIp(req),
  });
  const userId = (req: { params: Record<string, string | undefined> }): string => {
    const id = req.params.id;
    if (!id) throw new AppError(400, 'bad_request', 'User id is required');
    return id;
  };

  router.get(
    '/users',
    asyncHandler(async (req, res) => {
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      res.json({ users: await service.listUsers(req.auth!.orgId, q) });
    }),
  );

  router.post(
    '/users/:id/suspend',
    asyncHandler(async (req, res) => {
      const { suspended } = z.object({ suspended: z.boolean() }).parse(req.body);
      res.json(await service.setSuspended(req.auth!.orgId, userId(req), suspended, actor(req)));
    }),
  );

  router.post(
    '/users/:id/reset-password',
    asyncHandler(async (req, res) => {
      const result = await service.sendPasswordReset(req.auth!.orgId, userId(req), actor(req));
      if (env.NODE_ENV !== 'production') {
        console.log(`[dev] admin reset link for ${result.email}: token=${result.token}`);
      }
      res.json({ ok: true });
    }),
  );

  router.post(
    '/limit',
    asyncHandler(async (req, res) => {
      const { monthlySendLimit } = z
        .object({ monthlySendLimit: z.number().int().min(0).max(1_000_000) })
        .parse(req.body);
      res.json(await service.setMonthlyLimit(req.auth!.orgId, monthlySendLimit, actor(req)));
    }),
  );

  router.get(
    '/system/health',
    asyncHandler(async (req, res) => {
      res.json(await service.getHealth(req.auth!.orgId));
    }),
  );

  router.get(
    '/audit-logs',
    asyncHandler(async (req, res) => {
      res.json({ logs: await service.getAuditLogs(req.auth!.orgId) });
    }),
  );

  return router;
}
