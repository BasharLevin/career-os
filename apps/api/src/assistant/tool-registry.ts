import { BadRequestException, Injectable } from '@nestjs/common';
import {
  applicationStatusSchema,
  jobSearchQuerySchema,
  profileUpdateSchema,
  toolNameSchema,
  type ToolName,
  type JobSearchQuery,
  type JobSummary,
} from '@career-os/contracts';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Principal } from '../auth/principal.js';
import { DiscoveryService } from '../discovery/discovery.service.js';
import { MatchingService } from '../profile/matching.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { TrackingService } from '../tracking/tracking.service.js';
import type { ProviderTool } from './assistant-provider.js';

type Arguments = Record<string, unknown>;
const externalId = z
  .object({ externalId: z.string().regex(/^[\w-]{1,100}$/) })
  .strict();
const applicationId = z.object({ applicationId: z.uuid() }).strict();
const schemas: Record<ToolName, z.ZodType> = {
  search_jobs: jobSearchQuerySchema.strict(),
  get_job_details: externalId,
  compare_job_to_profile: externalId,
  compare_jobs: z
    .object({
      externalIds: z
        .array(z.string().regex(/^[\w-]{1,100}$/))
        .min(2)
        .max(5),
    })
    .strict(),
  list_saved_jobs: z.object({}).strict(),
  list_applications: z
    .object({ status: applicationStatusSchema.optional() })
    .strict(),
  get_application: applicationId,
  get_application_history: applicationId,
  get_user_profile: z.object({}).strict(),
  save_job: externalId,
  create_application: externalId.extend({
    initialStatus: applicationStatusSchema.default('saved'),
    idempotencyKey: z.string().min(8).max(200).optional(),
  }),
  update_application_status: applicationId.extend({
    status: applicationStatusSchema,
    expectedVersion: z.number().int().positive(),
  }),
  add_application_note: applicationId.extend({
    body: z.string().trim().min(1).max(10000),
  }),
  update_profile_preferences: profileUpdateSchema,
};
const mutating = new Set<ToolName>([
  'save_job',
  'create_application',
  'update_application_status',
  'add_application_note',
  'update_profile_preferences',
]);

@Injectable()
export class ToolRegistry {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly tracking: TrackingService,
    private readonly profiles: ProfileService,
    private readonly matching: MatchingService,
  ) {}
  definitions(): ProviderTool[] {
    return toolNameSchema.options.map((name) => ({
      name,
      description: this.description(name),
      parameters: this.jsonSchema(name),
    }));
  }
  isMutating(name: ToolName): boolean {
    return mutating.has(name);
  }
  parse(nameValue: string, raw: string): { name: ToolName; args: Arguments } {
    const name = toolNameSchema.safeParse(nameValue);
    if (!name.success) throw new BadRequestException('Unknown assistant tool');
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new BadRequestException('Malformed tool arguments');
    }
    const result = schemas[name.data].safeParse(json);
    if (!result.success)
      throw new BadRequestException('Invalid tool arguments');
    return { name: name.data, args: result.data as Arguments };
  }
  hash(args: Arguments): string {
    return createHash('sha256').update(JSON.stringify(args)).digest('hex');
  }
  async execute(
    name: ToolName,
    args: Arguments,
    p: Principal,
    correlationId: string,
  ): Promise<unknown> {
    switch (name) {
      case 'search_jobs':
        return this.searchJobs(p, jobSearchQuerySchema.parse(args));
      case 'get_job_details':
        return this.discovery.getJob(String(args.externalId));
      case 'compare_job_to_profile':
        return this.matching.compare(p, String(args.externalId));
      case 'compare_jobs':
        return Promise.all(
          (args.externalIds as string[]).map((id) =>
            this.matching.compare(p, id),
          ),
        );
      case 'list_saved_jobs':
        return this.tracking.saved(p);
      case 'list_applications':
        return this.tracking.list(p, args.status as never);
      case 'get_application':
        return this.tracking.one(p, String(args.applicationId));
      case 'get_application_history':
        return this.tracking.history(p, String(args.applicationId));
      case 'get_user_profile':
        return this.profiles.get(p);
      case 'save_job':
        return this.tracking.save(p, String(args.externalId), correlationId);
      case 'create_application':
        return this.tracking.create(
          p,
          String(args.externalId),
          applicationStatusSchema.parse(args.initialStatus ?? 'saved'),
          typeof args.idempotencyKey === 'string'
            ? args.idempotencyKey
            : this.hash(args),
          correlationId,
        );
      case 'update_application_status':
        return this.tracking.status(
          p,
          String(args.applicationId),
          applicationStatusSchema.parse(args.status),
          Number(args.expectedVersion),
          correlationId,
        );
      case 'add_application_note':
        return this.tracking.note(
          p,
          String(args.applicationId),
          String(args.body),
          correlationId,
        );
      case 'update_profile_preferences':
        return this.profiles.update(p, profileUpdateSchema.parse(args));
    }
  }
  private async searchJobs(p: Principal, input: JobSearchQuery) {
    const profile = await this.profiles.get(p);
    const roles = Array.isArray(profile.preferredRoles)
      ? profile.preferredRoles.filter(
          (value): value is string => typeof value === 'string',
        )
      : [];
    const locations = Array.isArray(profile.preferredLocations)
      ? profile.preferredLocations.filter(
          (value): value is string => typeof value === 'string',
        )
      : [];
    const generic =
      !input.q || /^(?:search|find|jobs?|sök|hitta|jobb)$/i.test(input.q);
    const criteria: JobSearchQuery = {
      ...input,
      q: generic ? roles[0] : input.q,
      municipality: input.municipality ?? locations[0],
      limit: Math.min(Math.max(input.limit, 20), 50),
    };
    if (!criteria.q && !criteria.municipality && !criteria.region)
      return {
        jobs: [],
        total: 0,
        offset: 0,
        limit: input.limit,
        hasMore: false,
        criteria,
        strict: true,
        provenance: 'jobtech-live' as const,
        profileDefaultsApplied: false,
        relaxedSuggestion:
          'Your approved profile does not yet provide a preferred role or location. Which role or location should I search?',
      };
    const jobTechCriteria = { ...criteria };
    delete jobTechCriteria.municipality;
    delete jobTechCriteria.region;
    const response = await this.discovery.search(jobTechCriteria);
    const locationFiltered = response.jobs.filter((job) => {
      const location =
        `${job.location.city ?? ''} ${job.location.municipality ?? ''} ${job.location.region ?? ''}`.toLocaleLowerCase(
          'sv',
        );
      return (
        (!criteria.municipality ||
          location.includes(criteria.municipality.toLocaleLowerCase('sv'))) &&
        (!criteria.region ||
          location.includes(criteria.region.toLocaleLowerCase('sv')))
      );
    });
    const junior =
      /\b(?:junior|graduate|trainee|entry[ -]?level|nyexaminerad)\b/i.test(
        input.q ?? '',
      );
    const skills = Array.isArray(profile.skills)
      ? profile.skills.filter(
          (value): value is string => typeof value === 'string',
        )
      : [];
    const scored = locationFiltered.map((job) => ({
      job,
      score: this.jobScore(job, criteria, skills, junior),
    }));
    const relevant = junior
      ? scored.filter(
          ({ job }) =>
            /\b(?:junior|graduate|trainee|entry[ -]?level|nyexaminerad)\b/i.test(
              job.headline,
            ) ||
            /\b(?:graduate role|traineeprogram|entry[ -]?level|nyexaminerad|0\s*[-–]\s*2\s*år|ingen erfarenhet krävs)\b/i.test(
              job.descriptionExcerpt ?? '',
            ),
        )
      : scored;
    relevant.sort((a, b) => b.score - a.score);
    return {
      ...response,
      jobs: relevant.map(({ job }) => job).slice(0, input.limit),
      total: relevant.length,
      criteria,
      strict: true,
      provenance: 'jobtech-live' as const,
      profileDefaultsApplied: generic,
      relaxedSuggestion:
        relevant.length === 0
          ? junior
            ? 'No explicit early-career evidence was found. I can broaden the search to roles with unspecified experience.'
            : 'No jobs matched these criteria. I can broaden the role or location if you confirm.'
          : undefined,
    };
  }
  private jobScore(
    job: JobSummary,
    criteria: JobSearchQuery,
    skills: string[],
    junior: boolean,
  ): number {
    const text =
      `${job.headline} ${job.descriptionExcerpt ?? ''}`.toLocaleLowerCase('sv');
    const query = criteria.q?.toLocaleLowerCase('sv') ?? '';
    let score =
      query && job.headline.toLocaleLowerCase('sv').includes(query) ? 50 : 0;
    if (query && text.includes(query)) score += 15;
    score +=
      skills.filter((skill) => text.includes(skill.toLocaleLowerCase('sv')))
        .length * 5;
    const place =
      `${job.location.city ?? ''} ${job.location.municipality ?? ''}`.toLocaleLowerCase(
        'sv',
      );
    if (
      criteria.municipality &&
      place.includes(criteria.municipality.toLocaleLowerCase('sv'))
    )
      score += 20;
    if (
      junior &&
      /\b(?:junior|graduate|trainee|entry[ -]?level|nyexaminerad)\b/i.test(text)
    )
      score += 35;
    if (job.publicationDate)
      score += Math.max(
        0,
        10 -
          Math.floor(
            (Date.now() - Date.parse(job.publicationDate)) / 86_400_000,
          ),
      );
    return score;
  }
  private description(name: ToolName): string {
    return (
      {
        search_jobs: 'Search current JobTech jobs',
        get_job_details: 'Get a current JobTech listing',
        compare_job_to_profile:
          'Compare one persisted job with the confirmed profile',
        compare_jobs: 'Compare two to five persisted jobs',
        list_saved_jobs: 'List the authenticated user saved jobs',
        list_applications: 'List the authenticated user applications',
        get_application: 'Get one owned application',
        get_application_history: 'Get status history for one owned application',
        get_user_profile: 'Get the authenticated user confirmed career profile',
        save_job: 'Save a JobTech job after confirmation',
        create_application: 'Create an application after confirmation',
        update_application_status:
          'Change an owned application status after confirmation',
        add_application_note: 'Add a note after confirmation',
        update_profile_preferences:
          'Update confirmed profile preferences after confirmation',
      } as const
    )[name];
  }
  private jsonSchema(name: ToolName): Record<string, unknown> {
    const object = (
      properties: Record<string, unknown>,
      required: string[] = [],
    ) => ({
      type: 'object',
      properties,
      required,
      additionalProperties: false,
    });
    const string = { type: 'string' };
    switch (name) {
      case 'search_jobs':
        return object(
          {
            q: string,
            offset: { type: 'integer' },
            limit: { type: 'integer' },
            remote: { type: 'boolean' },
          },
          [],
        );
      case 'compare_jobs':
        return object(
          {
            externalIds: {
              type: 'array',
              items: string,
              minItems: 2,
              maxItems: 5,
            },
          },
          ['externalIds'],
        );
      case 'list_saved_jobs':
      case 'get_user_profile':
        return object({});
      case 'list_applications':
        return object({ status: { type: 'string' } });
      case 'get_application':
      case 'get_application_history':
        return object({ applicationId: string }, ['applicationId']);
      case 'get_job_details':
      case 'compare_job_to_profile':
      case 'save_job':
        return object({ externalId: string }, ['externalId']);
      case 'create_application':
        return object(
          {
            externalId: string,
            initialStatus: { type: 'string' },
            idempotencyKey: string,
          },
          ['externalId'],
        );
      case 'update_application_status':
        return object(
          {
            applicationId: string,
            status: { type: 'string' },
            expectedVersion: { type: 'integer' },
          },
          ['applicationId', 'status', 'expectedVersion'],
        );
      case 'add_application_note':
        return object({ applicationId: string, body: string }, [
          'applicationId',
          'body',
        ]);
      case 'update_profile_preferences':
        return object(
          {
            preferredRoles: { type: 'array', items: string },
            preferredLocations: { type: 'array', items: string },
            remotePreference: { type: ['string', 'null'] },
            experienceLevel: { type: ['string', 'null'] },
            skills: { type: 'array', items: string },
            languages: { type: 'array', items: string },
            careerGoals: string,
            expectedVersion: { type: 'integer' },
          },
          [
            'preferredRoles',
            'preferredLocations',
            'remotePreference',
            'experienceLevel',
            'skills',
            'languages',
            'careerGoals',
            'expectedVersion',
          ],
        );
    }
  }
}
