// A liveness endpoint used by the deployment docs (curl GET /api/health) and by
// uptime checks. It intentionally touches no database, so it stays fast and does
// not fail when a dependency is briefly unavailable.
import { Router } from 'express';
import { APP_VERSION } from '../version.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'baitward-api',
    version: APP_VERSION,
    time: new Date().toISOString(),
  });
});
