import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import { parseApiEnvironment } from '@career-os/config';
import { createServiceLogger } from '@career-os/observability';
import type { NextFunction, Request, Response } from 'express';

const validCorrelationId = /^[A-Za-z0-9._-]{1,128}$/;

export function normalizeCorrelationId(
  value: string | string[] | undefined,
): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && validCorrelationId.test(candidate)
    ? candidate
    : randomUUID();
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger;

  constructor() {
    const environment = parseApiEnvironment(process.env);
    this.logger = createServiceLogger({
      environment: environment.NODE_ENV,
      level: environment.LOG_LEVEL,
      service: 'api',
      version: environment.APP_VERSION,
    });
  }

  use(request: Request, response: Response, next: NextFunction): void {
    const correlationId = normalizeCorrelationId(
      request.headers['x-correlation-id'],
    );
    const startedAt = performance.now();
    response.setHeader('x-correlation-id', correlationId);
    response.once('finish', () => {
      this.logger.info({
        correlationId,
        durationMs: Math.round(performance.now() - startedAt),
        event: 'http.request.completed',
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
      });
    });
    next();
  }
}
