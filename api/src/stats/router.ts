import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { createStatsService } from './service.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/async-handler.js';

// The dashboard overview for the signed-in organisation.
export function createDashboardRouter(prisma: PrismaClient): Router {
  const stats = createStatsService(prisma);
  const router = Router();
  router.use(requireAuth);

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json(await stats.getOverview(req.auth!.orgId));
    }),
  );

  return router;
}
