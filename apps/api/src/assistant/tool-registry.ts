import { BadRequestException, Injectable } from '@nestjs/common';
import {
  applicationStatusSchema,
  jobSearchQuerySchema,
  profileUpdateSchema,
  toolNameSchema,
  type ToolName,
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
        return this.discovery.search(jobSearchQuerySchema.parse(args));
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
