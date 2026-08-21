import { z } from 'zod';

export const experienceLevelSchema = z.enum([
  'entry',
  'mid',
  'senior',
  'lead',
  'executive',
]);
export const remotePreferenceSchema = z.enum([
  'remote',
  'hybrid',
  'onsite',
  'flexible',
]);
const shortList = z.array(z.string().trim().min(1).max(120)).max(50);

export const profileUpdateSchema = z
  .object({
    preferredRoles: shortList,
    preferredLocations: shortList,
    remotePreference: remotePreferenceSchema.nullable(),
    experienceLevel: experienceLevelSchema.nullable(),
    skills: shortList,
    languages: shortList,
    careerGoals: z.string().trim().max(5000),
    expectedVersion: z.number().int().positive(),
  })
  .strict();

export const extractedProfileSchema = z.object({
  preferredRoles: shortList,
  preferredLocations: shortList,
  experienceLevel: experienceLevelSchema.nullable(),
  skills: shortList,
  languages: shortList,
  summary: z.string().max(5000),
});

export const profileApprovalSchema = z
  .object({
    documentId: z.uuid(),
    fields: extractedProfileSchema,
    expectedVersion: z.number().int().positive(),
  })
  .strict();

export const matchEvidenceSchema = z.object({
  requirement: z.string(),
  profileEvidence: z.array(z.string()),
  jobEvidence: z.array(z.string()),
  provenance: z.enum(['source_fact', 'deterministic_inference']),
});
export const matchAssessmentSchema = z.object({
  id: z.uuid().optional(),
  overallScore: z.number().int().min(0).max(100),
  matchingRequirements: z.array(matchEvidenceSchema),
  missingRequirements: z.array(matchEvidenceSchema),
  uncertainRequirements: z.array(matchEvidenceSchema),
  experienceCompatibility: z.enum(['compatible', 'uncertain', 'incompatible']),
  locationCompatibility: z.enum(['compatible', 'uncertain', 'incompatible']),
  recommendation: z.enum(['strong_match', 'possible_match', 'weak_match']),
  rationale: z.string(),
  logicVersion: z.string(),
  profileVersion: z.number().int().positive(),
  jobRefreshedAt: z.string().datetime(),
  model: z.string().nullable(),
  configuration: z.record(z.string(), z.unknown()),
  calculatedAt: z.string().datetime(),
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type ExtractedProfile = z.infer<typeof extractedProfileSchema>;
export type MatchAssessment = z.infer<typeof matchAssessmentSchema>;
