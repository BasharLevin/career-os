import { z } from 'zod';

const nodeEnvironmentSchema = z.enum(['development', 'test', 'production']);
const logLevelSchema = z.enum([
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
]);
const portSchema = z.coerce.number().int().min(1).max(65_535);

const operationalSchema = z.object({
  NODE_ENV: nodeEnvironmentSchema.default('development'),
  LOG_LEVEL: logLevelSchema.default('info'),
  APP_VERSION: z.string().min(1).default('development'),
});

export const apiEnvironmentSchema = operationalSchema.extend({
  API_PORT: portSchema.default(3001),
});

export const workerEnvironmentSchema = operationalSchema.extend({
  WORKER_HEALTH_PORT: portSchema.default(3002),
});

export const webEnvironmentSchema = operationalSchema.extend({
  NEXT_PUBLIC_API_BASE_URL: z.url().default('http://localhost:3001'),
});

export type ApiEnvironment = z.infer<typeof apiEnvironmentSchema>;
export type WebEnvironment = z.infer<typeof webEnvironmentSchema>;
export type WorkerEnvironment = z.infer<typeof workerEnvironmentSchema>;

export function parseApiEnvironment(source: NodeJS.ProcessEnv): ApiEnvironment {
  return apiEnvironmentSchema.parse(source);
}

export function parseWebEnvironment(source: NodeJS.ProcessEnv): WebEnvironment {
  return webEnvironmentSchema.parse(source);
}

export function parseWorkerEnvironment(
  source: NodeJS.ProcessEnv,
): WorkerEnvironment {
  return workerEnvironmentSchema.parse(source);
}
