import { z } from 'zod';
import { jobDetailSchema, jobIdSchema } from './jobs.js';

export const applicationStatuses = [
  'saved',
  'preparing',
  'applied',
  'screening',
  'interview',
  'technical_interview',
  'offer',
  'rejected',
  'withdrawn',
  'accepted',
] as const;
export const applicationStatusSchema = z.enum(applicationStatuses);
export const uuidSchema = z.uuid();
export const versionSchema = z.coerce.number().int().positive();
export const saveJobRequestSchema = z.object({ externalId: jobIdSchema });
export const createApplicationRequestSchema = z.object({
  externalId: jobIdSchema,
  initialStatus: applicationStatusSchema.default('saved'),
});
export const applicationListQuerySchema = z.object({
  status: applicationStatusSchema.optional(),
});
export const updateStatusRequestSchema = z.object({
  status: applicationStatusSchema,
  expectedVersion: versionSchema,
});
export const noteRequestSchema = z.object({
  body: z.string().trim().min(1).max(10_000),
  expectedVersion: versionSchema.optional(),
});
export const idempotencyKeySchema = z.string().trim().min(8).max(200);

export const persistedJobSchema = z.object({
  id: uuidSchema,
  source: z.literal('jobtech'),
  externalId: jobIdSchema,
  sourceUrl: z.url(),
  snapshot: jobDetailSchema,
  publicationDate: z.iso.datetime({ offset: true }).nullable(),
  applicationDeadline: z.iso.datetime({ offset: true }).nullable(),
  firstPersistedAt: z.iso.datetime(),
  lastRefreshedAt: z.iso.datetime(),
});
export const savedJobSchema = z.object({
  id: uuidSchema,
  job: persistedJobSchema,
  savedAt: z.iso.datetime(),
});
export const historySchema = z.object({
  id: uuidSchema,
  fromStatus: applicationStatusSchema.nullable(),
  toStatus: applicationStatusSchema,
  changedAt: z.iso.datetime(),
});
export const noteSchema = z.object({
  id: uuidSchema,
  body: z.string(),
  version: versionSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const applicationSchema = z.object({
  id: uuidSchema,
  job: persistedJobSchema,
  status: applicationStatusSchema,
  version: versionSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  notes: z.array(noteSchema).optional(),
});
export const savedJobsResponseSchema = z.object({
  items: z.array(savedJobSchema),
});
export const applicationsResponseSchema = z.object({
  items: z.array(applicationSchema),
});
export const historyResponseSchema = z.object({
  items: z.array(historySchema),
});

export type Application = z.infer<typeof applicationSchema>;
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type PersistedJob = z.infer<typeof persistedJobSchema>;
export type SavedJob = z.infer<typeof savedJobSchema>;
