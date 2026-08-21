import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

export function correlationIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const supplied = request.header('x-correlation-id');
  const id =
    supplied && /^[A-Za-z0-9._-]{8,100}$/.test(supplied)
      ? supplied
      : randomUUID();
  response.locals.correlationId = id;
  response.setHeader('x-correlation-id', id);
  next();
}
