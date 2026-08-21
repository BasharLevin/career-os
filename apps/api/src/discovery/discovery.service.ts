import {
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  AutocompleteResponse,
  JobDetail,
  JobSearchQuery,
  JobSearchResponse,
} from '@career-os/contracts';
import { JobTechClient, JobTechError } from '@career-os/jobtech-client';
import { ResponseCache } from './response-cache.js';

@Injectable()
export class DiscoveryService {
  constructor(
    @Inject(JobTechClient) private readonly client: JobTechClient,
    @Inject(ResponseCache) private readonly cache: ResponseCache,
  ) {}

  search(
    query: JobSearchQuery,
    signal?: AbortSignal,
  ): Promise<JobSearchResponse> {
    return this.withTranslation(() =>
      this.cache.getOrLoad(`search:${JSON.stringify(query)}`, () =>
        this.client.search(query, signal),
      ),
    );
  }

  autocomplete(
    query: string,
    signal?: AbortSignal,
  ): Promise<AutocompleteResponse> {
    return this.withTranslation(() =>
      this.cache.getOrLoad(`complete:${query.toLocaleLowerCase('sv-SE')}`, () =>
        this.client.autocomplete(query, signal),
      ),
    );
  }

  getJob(id: string, signal?: AbortSignal): Promise<JobDetail> {
    return this.withTranslation(() =>
      this.cache.getOrLoad(`job:${id}`, () => this.client.getJob(id, signal)),
    );
  }

  private async withTranslation<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (!(error instanceof JobTechError)) throw error;
      switch (error.code) {
        case 'not_found':
          throw new NotFoundException('The requested job was not found');
        case 'rate_limited':
          throw new HttpException(
            'Job search is temporarily rate limited',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        case 'timeout':
          throw new GatewayTimeoutException('Job search timed out');
        case 'invalid_response':
        case 'unavailable':
          throw new ServiceUnavailableException(
            'Job search is temporarily unavailable',
          );
      }
    }
  }
}
