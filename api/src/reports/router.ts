import { Router } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { createReportService } from './service.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/async-handler.js';
import { AppError } from '../lib/http-error.js';

const createSchema = z.object({
  campaignId: z.string().min(1),
  locale: z.enum(['tr', 'en']),
});

export function createReportsRouter(prisma: PrismaClient): Router {
  const service = createReportService(prisma);
  const router = Router();
  router.use(requireAuth);

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json({ reports: await service.list(req.auth!.orgId) });
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const body = createSchema.parse(req.body);
      res.status(201).json(await service.generate(req.auth!.orgId, body));
    }),
  );

  router.get(
    '/:id/pdf',
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!id) throw new AppError(400, 'bad_request', 'Report id is required');
      const { buffer, filename } = await service.getPdf(req.auth!.orgId, id);
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    }),
  );

  return router;
}
