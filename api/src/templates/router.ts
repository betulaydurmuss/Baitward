import { Router } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { createTemplateService } from './service.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/async-handler.js';
import { AppError } from '../lib/http-error.js';

const localeSchema = z.enum(['tr', 'en']);
const difficultySchema = z.enum(['easy', 'medium', 'hard']);

const createSchema = z.object({
  name: z.string().min(1).max(120),
  locale: localeSchema,
  subject: z.string().min(1).max(300),
  html: z.string().min(1).max(50_000),
  difficulty: difficultySchema.default('medium'),
  category: z.string().max(60).optional(),
});
const updateSchema = createSchema.partial();

export function createTemplatesRouter(prisma: PrismaClient): Router {
  const service = createTemplateService(prisma);
  const router = Router();
  router.use(requireAuth);

  function id(req: { params: Record<string, string | undefined> }): string {
    const value = req.params.id;
    if (!value) throw new AppError(400, 'bad_request', 'Template id is required');
    return value;
  }

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json({ templates: await service.list(req.auth!.orgId) });
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      res.json(await service.get(req.auth!.orgId, id(req)));
    }),
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
