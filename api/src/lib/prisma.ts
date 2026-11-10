// A single shared PrismaClient for the process. Creating more than one opens
// redundant connection pools, so everything imports this instance.
//
// Loading dotenv here means any entry point that touches the database — the server,
// the seed script and the admin CLI — gets DATABASE_URL from the local .env.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export type Db = PrismaClient;
