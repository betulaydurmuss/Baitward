import { Router } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { createCampaignService } from './service.js';
import { createStatsService } from '../stats/service.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/async-handler.js';
import { AppError } from '../lib/http-error.js';

const createSchema = z
  .object({
    templateId: z.string().min(1),
    scheduledAt: z.coerce.date().optional(),
    dripPerMin: z.number().int().min(1).max(600).optional(),
    targetIds: z.array(z.string()).optional(),
    groups: z.array(z.string()).optional(),
  })
  .refine((v) => (v.targetIds?.length ?? 0) > 0 || (v.groups?.length ?? 0) > 0, {
    message: 'Provide targetIds or groups',
  });

export function createCampaignsRouter(prisma: PrismaClient): Router {
  const service = createCampaignService(prisma);
  const stats = createStatsService(prisma);
  const router = Router();
  router.use(requireAuth);

  function id(req: { params: Record<string, string | undefined> }): string {
    const value = req.params.id;
    if (!value) throw new AppError(400, 'bad_request', 'Campaign id is required');
    return value;
  }

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json({ campaigns: await service.list(req.auth!.orgId) });
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      res.json(await service.get(req.auth!.orgId, id(req)));
    }),
  );

  router.get(
    '/:id/stats',
    asyncHandler(async (req, res) => {
      res.json(await stats.getCampaignStats(req.auth!.orgId, id(req)));
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const body = createSchema.parse(req.body);
      res.status(201).json(await service.create(req.auth!.orgId, body));
    }),
  );

  router.post(
    '/:id/launch',
    asyncHandler(async (req, res) => {
      res.json(await service.launch(req.auth!.orgId, id(req)));
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
