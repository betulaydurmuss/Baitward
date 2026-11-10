// Central error handling: turns thrown AppErrors and zod validation failures into
// consistent JSON, and anything unexpected into a generic 500 (never leaking stack
// traces or internals to the client).
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/http-error.js';

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'not_found', message: 'Resource not found' } });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction, // Express identifies an error handler by its 4-argument shape
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Invalid request',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong' } });
}
