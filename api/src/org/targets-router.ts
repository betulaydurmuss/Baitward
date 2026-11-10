// A first organisation-scoped resource. Every query is filtered by the org id taken
// from the caller's access token (req.auth.orgId) — never from a value the client
// sends — so one organisation can never read another's targets. Later phases add
// create/update/delete on this same scoped foundation.
import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/async-handler.js';

export function createTargetsRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get(
    '/',
    requireAuth,
    asyncHandler(async (req, res) => {
      const targets = await prisma.target.findMany({
        where: { orgId: req.auth!.orgId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          department: true,
          locale: true,
        },
      });
      res.json({ targets });
    }),
  );

  return router;
}
