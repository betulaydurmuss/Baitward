// Adds the authenticated caller to Express's Request type, so handlers can read
// req.auth with full typing after requireAuth has run.
import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        orgId: string;
        role: Role;
      };
    }
  }
}

export {};
