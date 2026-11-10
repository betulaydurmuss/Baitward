// Express 4 does not forward rejected promises to the error handler, so every
// async route is wrapped in this: it catches and passes errors to next().
import type { NextFunction, Request, Response } from 'express';

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
