import pino, { type Logger, type LoggerOptions } from 'pino';

export const sensitiveLogPaths = [
  'authorization',
  'password',
  'token',
  'apiKey',
  'req.headers.authorization',
  'request.headers.authorization',
  '*.password',
  '*.token',
  '*.apiKey',
] as const;

export interface LoggerContext {
  environment: string;
  level: string;
  service: string;
  version: string;
}

export function createServiceLogger(context: LoggerContext): Logger {
  const options: LoggerOptions = {
    base: {
      environment: context.environment,
      service: context.service,
      version: context.version,
    },
    level: context.level,
    redact: {
      paths: [...sensitiveLogPaths],
      censor: '[REDACTED]',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  return pino(options);
}
