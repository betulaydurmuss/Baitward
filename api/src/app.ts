// Builds the Express application without starting a server, so tests can drive it
// in-process with supertest. Server startup lives in index.ts.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import type { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { healthRouter } from './routes/health.js';
import { createAuthRouter } from './auth/router.js';
import { createTargetsRouter } from './targets/router.js';
import { createTemplatesRouter } from './templates/router.js';
import { createCampaignsRouter } from './campaigns/router.js';
import { createTrackingRouter } from './tracking/router.js';
import { createDashboardRouter } from './stats/router.js';
import { createLandingRouter } from './landing/router.js';
import { createTrainingRouter } from './training/router.js';
import { createPublicTrainingRouter } from './training/public-router.js';
import { errorHandler, notFound } from './middleware/error.js';

export function createApp(prisma: PrismaClient) {
  const app = express();

  // Do not advertise the framework.
  app.disable('x-powered-by');
  // One proxy hop in deployment; makes req.ip and rate limiting see the real client.
  app.set('trust proxy', 1);

  // Secure headers (CSP, HSTS, no-sniff, etc.).
  app.use(helmet());
  // Only our own web origin may call the API, and it may send the cookie.
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));

  app.use(express.json());
  app.use(cookieParser());

  app.use('/api', healthRouter);
  app.use('/api/auth', createAuthRouter(prisma));
  app.use('/api/targets', createTargetsRouter(prisma));
  app.use('/api/templates', createTemplatesRouter(prisma));
  app.use('/api/campaigns', createCampaignsRouter(prisma));
  app.use('/api/landing-pages', createLandingRouter(prisma));
  app.use('/api/training', createTrainingRouter(prisma));
  app.use('/api/dashboard', createDashboardRouter(prisma));

  // Public training endpoints, identified by the recipient's token (no auth).
  app.use('/api/public/training', createPublicTrainingRouter(prisma));

  // Public tracking endpoints (open pixel, click, submit) live at the root so the
  // links embedded in emails are short.
  app.use('/', createTrackingRouter(prisma));

  // Unmatched routes and the final error handler.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
