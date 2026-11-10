// HTTP routes for targets. The org id always comes from the access token
// (req.auth.orgId), never from the request body, which is what keeps tenants
// isolated.
import { Router } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { createTargetService } from './service.js';
import { SAMPLE_CSV } from './csv.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/async-handler.js';
import { AppError } from '../lib/http-error.js';

const csvSchema = z.object({ csv: z.string().min(1).max(500_000) });

const localeSchema = z.enum(['tr', 'en']);

const createSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
  department: z.string().max(80).optional(),
  locale: localeSchema.default('tr'),
  groups: z.array(z.string().max(60)).max(50).optional(),
});
const updateSchema = createSchema.partial();

export function createTargetsRouter(prisma: PrismaClient): Router {
  const service = createTargetService(prisma);
  const router = Router();
  router.use(requireAuth);

  function id(req: { params: Record<string, string | undefined> }): string {
    const value = req.params.id;
    if (!value) throw new AppError(400, 'bad_request', 'Target id is required');
    return value;
  }

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json({ targets: await service.list(req.auth!.orgId) });
    }),
  );

  // A sample CSV the user can download, fill in and re-upload.
  router.get('/import/sample', (_req, res) => {
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="targets-sample.csv"');
    res.send(SAMPLE_CSV);
  });

  router.post(
    '/import/preview',
    asyncHandler(async (req, res) => {
      const { csv } = csvSchema.parse(req.body);
      res.json(service.importPreview(csv));
    }),
  );

  router.post(
    '/import/commit',
    asyncHandler(async (req, res) => {
      const { csv } = csvSchema.parse(req.body);
      res.json(await service.importCommit(req.auth!.orgId, csv));
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
