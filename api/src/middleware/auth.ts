// Route guards. requireAuth turns a Bearer access token into req.auth; requireRole
// restricts a route to specific roles. Both throw AppError, which the error
// middleware renders.
import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { AppError } from '../lib/http-error.js';
import { verifyAccessToken } from '../lib/tokens.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'unauthorized', 'Not authenticated');
  }
  try {
    const claims = verifyAccessToken(header.slice('Bearer '.length));
    req.auth = { userId: claims.sub, orgId: claims.org, role: claims.role };
    next();
  } catch {
    throw new AppError(401, 'unauthorized', 'Invalid or expired token');
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      throw new AppError(403, 'forbidden', 'You do not have access to this resource');
    }
    next();
  };
}
