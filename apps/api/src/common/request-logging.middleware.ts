import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import { parseApiEnvironment } from '@career-os/config';
import { createServiceLogger } from '@career-os/observability';
import type { NextFunction, Request, Response } from 'express';

const validCorrelationId = /^[A-Za-z0-9._-]{1,128}$/;

export function normalizeCorrelationId(value: unknown): string {
  const candidate =
    typeof value === 'string'
      ? value
      : Array.isArray(value) && typeof value[0] === 'string'
        ? value[0]
        : undefined;
  return candidate && validCorrelationId.test(candidate)
    ? candidate
    : randomUUID();
}

export interface CompletionRequest {
  method: string;
  path: string;
}

export interface CompletionResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  once(event: 'finish', listener: () => void): void;
}

export interface CompletionLogger {
  info(fields: {
    correlationId: string;
    durationMs: number;
    event: 'http.request.completed';
    method: string;
    path: string;
    statusCode: number;
  }): void;
}

export function registerResponseCompletion(
  request: CompletionRequest,
  response: CompletionResponse,
  logger: CompletionLogger,
  correlationId: string,
  startedAt: number,
  now: () => number = () => performance.now(),
): void {
  response.setHeader('x-correlation-id', correlationId);
  response.once('finish', () => {
    logger.info({
      correlationId,
      durationMs: Math.round(now() - startedAt),
      event: 'http.request.completed',
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
    });
  });
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
    registerResponseCompletion(
      request,
      response,
      this.logger,
      correlationId,
      startedAt,
    );
    next();
  }
}
