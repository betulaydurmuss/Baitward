// Builds the Express application without starting a server, so tests can drive it
// in-process with supertest. Server startup lives in index.ts.
import express from 'express';
import { healthRouter } from './routes/health.js';

export function createApp() {
  const app = express();

  // Parse JSON bodies; individual routes validate their shape with zod.
  app.use(express.json());

  // All API routes are mounted under /api.
  app.use('/api', healthRouter);

  return app;
}
