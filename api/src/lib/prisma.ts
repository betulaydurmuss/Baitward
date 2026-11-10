// A single shared PrismaClient for the process. Creating more than one opens
// redundant connection pools, so everything imports this instance.
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export type Db = PrismaClient;
