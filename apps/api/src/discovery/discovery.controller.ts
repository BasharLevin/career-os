import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import {
  autocompleteQuerySchema,
  jobIdSchema,
  jobSearchQuerySchema,
  type AutocompleteResponse,
  type JobDetail,
  type JobSearchResponse,
} from '@career-os/contracts';
import type { Request } from 'express';
import { ZodError } from 'zod';
import { DiscoveryService } from './discovery.service.js';

@Controller('v1/jobs')
export class DiscoveryController {
  constructor(
    @Inject(DiscoveryService) private readonly discovery: DiscoveryService,
  ) {}

  @Get()
  search(
    @Query() rawQuery: unknown,
    @Req() request: Request,
  ): Promise<JobSearchResponse> {
    return this.discovery.search(
      this.parse(jobSearchQuerySchema, rawQuery),
      this.abortSignal(request),
    );
  }

  @Get('autocomplete')
  autocomplete(
    @Query() rawQuery: unknown,
    @Req() request: Request,
  ): Promise<AutocompleteResponse> {
    const query = this.parse(autocompleteQuerySchema, rawQuery);
    return this.discovery.autocomplete(query.q, this.abortSignal(request));
  }

  @Get(':id')
  getJob(
    @Param('id') rawId: string,
    @Req() request: Request,
  ): Promise<JobDetail> {
    return this.discovery.getJob(
      this.parse(jobIdSchema, rawId),
      this.abortSignal(request),
    );
  }

  private parse<T>(schema: { parse(value: unknown): T }, value: unknown): T {
    try {
      return schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          error: 'Bad Request',
          message: 'Invalid request parameters',
          issues: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
          statusCode: 400,
        });
      }
      throw error;
    }
  }

  private abortSignal(request: Request): AbortSignal {
    const controller = new AbortController();
    request.once('aborted', () =>
      controller.abort(new Error('Client disconnected')),
    );
    return controller.signal;
  }
}
