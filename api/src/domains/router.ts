import { Router } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { createDomainService } from './service.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../lib/async-handler.js';
import { AppError } from '../lib/http-error.js';
import { getClientIp } from '../lib/request.js';
import { env } from '../env.js';

const domainSchema = z.object({ domain: z.string().min(3).max(253) });

export function createDomainsRouter(prisma: PrismaClient): Router {
  const service = createDomainService(prisma);
  const router = Router();
  router.use(requireAuth, requireRole('org_admin', 'super_admin'));

  const actor = (req: { auth?: { userId: string } } & Parameters<typeof getClientIp>[0]) => ({
    actorId: req.auth!.userId,
    ip: getClientIp(req),
  });
  const id = (req: { params: Record<string, string | undefined> }): string => {
    const value = req.params.id;
    if (!value) throw new AppError(400, 'bad_request', 'Domain id is required');
    return value;
  };

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const domains = await service.list(req.auth!.orgId);
      res.json({
        domains: domains.map((d) => ({ ...d, txtRecord: service.txtRecord(d.token) })),
        devVerifyAvailable: env.NODE_ENV !== 'production',
      });
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const { domain } = domainSchema.parse(req.body);
      const record = await service.add(req.auth!.orgId, domain, actor(req));
      res.status(201).json({ ...record, txtRecord: service.txtRecord(record.token) });
    }),
  );

  router.post(
    '/:id/verify',
    asyncHandler(async (req, res) => {
      res.json(await service.verify(req.auth!.orgId, id(req), actor(req)));
    }),
  );

  router.post(
    '/:id/dev-verify',
    asyncHandler(async (req, res) => {
      res.json(await service.devVerify(req.auth!.orgId, id(req), actor(req)));
    }),
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      await service.remove(req.auth!.orgId, id(req));
      res.json({ ok: true });
    }),
  );

  return router;
}
