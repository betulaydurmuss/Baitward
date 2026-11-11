import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { createRiskService } from './service.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/async-handler.js';

export function createRiskRouter(prisma: PrismaClient): Router {
  const service = createRiskService(prisma);
  const router = Router();
  router.use(requireAuth);

  router.get(
    '/scores',
    asyncHandler(async (req, res) => {
      res.json(await service.getScores(req.auth!.orgId));
    }),
  );

  return router;
}
