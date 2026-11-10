import { Router } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { createTrainingService } from './service.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/async-handler.js';
import { AppError } from '../lib/http-error.js';

const quizSchema = z.array(
  z.object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(6),
    answer: z.number().int().min(0),
  }),
);
const createSchema = z.object({
  title: z.string().min(1).max(160),
  locale: z.enum(['tr', 'en']),
  content: z.string().min(1).max(20_000),
  quiz: quizSchema,
});
const updateSchema = createSchema.partial();

export function createTrainingRouter(prisma: PrismaClient): Router {
  const service = createTrainingService(prisma);
  const router = Router();
  router.use(requireAuth);

  const id = (req: { params: Record<string, string | undefined> }): string => {
    const value = req.params.id;
    if (!value) throw new AppError(400, 'bad_request', 'Training id is required');
    return value;
  };

  router.get(
    '/',
    asyncHandler(async (req, res) => res.json({ modules: await service.list(req.auth!.orgId) })),
  );
  router.get(
    '/:id',
    asyncHandler(async (req, res) => res.json(await service.get(req.auth!.orgId, id(req)))),
  );
  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const body = createSchema.parse(req.body);
      res.status(201).json(await service.create(req.auth!.orgId, body));
    }),
  );
  router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      const body = updateSchema.parse(req.body);
      res.json(await service.update(req.auth!.orgId, id(req), body));
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
