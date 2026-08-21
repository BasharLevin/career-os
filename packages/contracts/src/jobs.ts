import { z } from 'zod';

const trimmedOptionalText = (maximum: number) =>
  z.string().trim().min(1).max(maximum).optional();

export const jobSearchQuerySchema = z.object({
  q: trimmedOptionalText(200),
  offset: z.coerce.number().int().min(0).max(1_900).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  remote: z
    .union([
      z.boolean(),
      z.enum(['true', 'false']).transform((value) => value === 'true'),
    ])
    .optional(),
  municipality: trimmedOptionalText(100),
  region: trimmedOptionalText(100),
  occupationField: trimmedOptionalText(100),
  publishedAfter: z.iso.datetime({ offset: true }).optional(),
});

export const autocompleteQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
});

export const jobIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_-]+$/);

export const taxonomyItemSchema = z.object({
  conceptId: z.string().nullable(),
  label: z.string().nullable(),
});

export const jobLocationSchema = z.object({
  municipality: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().nullable(),
  city: z.string().nullable(),
});

export const jobSummarySchema = z.object({
  id: jobIdSchema,
  headline: z.string(),
  employerName: z.string().nullable(),
  location: jobLocationSchema,
  occupation: taxonomyItemSchema.nullable(),
  employmentType: taxonomyItemSchema.nullable(),
  publicationDate: z.string().nullable(),
  applicationDeadline: z.string().nullable(),
  webpageUrl: z.url().nullable(),
  remote: z.boolean().nullable(),
  descriptionExcerpt: z.string().nullable(),
});

export const jobDetailSchema = jobSummarySchema.extend({
  description: z.string().nullable(),
  numberOfVacancies: z.number().int().nonnegative().nullable(),
  salaryDescription: z.string().nullable(),
  workingHoursType: taxonomyItemSchema.nullable(),
  applicationUrl: z.url().nullable(),
  mustHaveSkills: z.array(taxonomyItemSchema),
  niceToHaveSkills: z.array(taxonomyItemSchema),
});

export const jobSearchResponseSchema = z.object({
  jobs: z.array(jobSummarySchema),
  total: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
});

export const autocompleteSuggestionSchema = z.object({
  value: z.string(),
  type: z.string(),
  occurrences: z.number().int().nonnegative(),
});

export const autocompleteResponseSchema = z.object({
  suggestions: z.array(autocompleteSuggestionSchema),
});

export type AutocompleteQuery = z.infer<typeof autocompleteQuerySchema>;
export type AutocompleteResponse = z.infer<typeof autocompleteResponseSchema>;
export type JobDetail = z.infer<typeof jobDetailSchema>;
export type JobSearchQuery = z.infer<typeof jobSearchQuerySchema>;
export type JobSearchResponse = z.infer<typeof jobSearchResponseSchema>;
export type JobSummary = z.infer<typeof jobSummarySchema>;
