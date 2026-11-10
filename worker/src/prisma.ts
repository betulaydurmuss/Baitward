// The worker's PrismaClient. The datasource URL is passed explicitly so the worker
// needs no .env file of its own — the default points at the local database.
import { PrismaClient } from '@prisma/client';
import { workerEnv } from './env.js';

export const prisma = new PrismaClient({
  datasources: { db: { url: workerEnv.DATABASE_URL } },
});
