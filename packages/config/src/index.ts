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
  WEB_ORIGIN: z.url().default('http://localhost:3000'),
  JOBTECH_SEARCH_BASE_URL: z
    .url()
    .default('https://jobsearch.api.jobtechdev.se'),
  JOBTECH_REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(100)
    .max(30_000)
    .default(5_000),
  JOBTECH_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  JOBTECH_CACHE_TTL_SECONDS: z.coerce
    .number()
    .int()
    .min(1)
    .max(3_600)
    .default(60),
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
