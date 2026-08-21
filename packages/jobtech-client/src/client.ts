import type {
  AutocompleteResponse,
  JobDetail,
  JobSearchQuery,
  JobSearchResponse,
} from '@career-os/contracts';
import { ZodError } from 'zod';
import { JobTechError } from './errors.js';
import { mapJobDetail, mapJobSummary } from './mapper.js';
import {
  upstreamAutocompleteResponseSchema,
  upstreamJobSchema,
  upstreamSearchResponseSchema,
} from './schemas.js';

export interface JobTechClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  maxRetries?: number;
  requestTimeoutMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
}

export class JobTechClient {
  private readonly fetchImplementation: typeof fetch;
  private readonly maxRetries: number;
  private readonly requestTimeoutMs: number;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(private readonly options: JobTechClientOptions) {
    this.fetchImplementation = options.fetch ?? globalThis.fetch;
    this.maxRetries = options.maxRetries ?? 2;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 5_000;
    this.sleep =
      options.sleep ??
      ((milliseconds) =>
        new Promise((resolve) => setTimeout(resolve, milliseconds)));
  }

  async search(
    query: JobSearchQuery,
    signal?: AbortSignal,
  ): Promise<JobSearchResponse> {
    const url = this.buildUrl('/search', {
      q: query.q,
      offset: String(query.offset),
      limit: String(query.limit),
      remote: query.remote === undefined ? undefined : String(query.remote),
      municipality: query.municipality,
      region: query.region,
      'occupation-field': query.occupationField,
      'published-after': query.publishedAfter,
    });
    const payload = this.parseBoundary(
      upstreamSearchResponseSchema,
      await this.requestJson(url, signal),
      'search',
    );
    return {
      jobs: payload.hits.map(mapJobSummary),
      total: payload.total.value,
      offset: query.offset,
      limit: query.limit,
      hasMore: query.offset + payload.hits.length < payload.total.value,
    };
  }

  async autocomplete(
    query: string,
    signal?: AbortSignal,
  ): Promise<AutocompleteResponse> {
    const url = this.buildUrl('/complete', { q: query });
    const payload = this.parseBoundary(
      upstreamAutocompleteResponseSchema,
      await this.requestJson(url, signal),
      'autocomplete',
    );
    return { suggestions: payload.typeahead };
  }

  async getJob(id: string, signal?: AbortSignal): Promise<JobDetail> {
    const url = this.buildUrl(`/ad/${encodeURIComponent(id)}`, {});
    try {
      return mapJobDetail(
        upstreamJobSchema.parse(await this.requestJson(url, signal)),
      );
    } catch (error) {
      if (error instanceof ZodError) {
        throw new JobTechError(
          'invalid_response',
          'JobTech returned an invalid job response',
          undefined,
          {
            cause: error,
          },
        );
      }
      throw error;
    }
  }

  private buildUrl(
    path: string,
    values: Record<string, string | undefined>,
  ): URL {
    const url = new URL(path, this.options.baseUrl);
    for (const [name, value] of Object.entries(values)) {
      if (value !== undefined) url.searchParams.set(name, value);
    }
    return url;
  }

  private parseBoundary<T>(
    schema: { parse(value: unknown): T },
    value: unknown,
    operation: string,
  ): T {
    try {
      return schema.parse(value);
    } catch (error) {
      throw new JobTechError(
        'invalid_response',
        `JobTech returned an invalid ${operation} response`,
        undefined,
        { cause: error },
      );
    }
  }

  private async requestJson(
    url: URL,
    callerSignal?: AbortSignal,
  ): Promise<unknown> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      if (callerSignal?.aborted) throw callerSignal.reason;
      const timeout = AbortSignal.timeout(this.requestTimeoutMs);
      const signal = callerSignal
        ? AbortSignal.any([callerSignal, timeout])
        : timeout;
      try {
        const response = await this.fetchImplementation(url, {
          headers: { accept: 'application/json' },
          method: 'GET',
          signal,
        });
        if (response.ok) return await response.json();
        if (response.status === 404)
          throw new JobTechError('not_found', 'Job not found', 404);
        if (response.status === 429 && attempt === this.maxRetries) {
          throw new JobTechError(
            'rate_limited',
            'JobTech rate limit exceeded',
            429,
          );
        }
        if (
          (response.status === 429 || response.status >= 500) &&
          attempt < this.maxRetries
        ) {
          await this.sleep(100 * 2 ** attempt);
          continue;
        }
        throw new JobTechError(
          'unavailable',
          'JobTech request failed',
          response.status,
        );
      } catch (error) {
        if (error instanceof JobTechError) throw error;
        if (callerSignal?.aborted) throw error;
        if (timeout.aborted) {
          if (attempt < this.maxRetries) {
            await this.sleep(100 * 2 ** attempt);
            continue;
          }
          throw new JobTechError(
            'timeout',
            'JobTech request timed out',
            undefined,
            { cause: error },
          );
        }
        if (attempt < this.maxRetries) {
          await this.sleep(100 * 2 ** attempt);
          continue;
        }
        throw new JobTechError(
          'unavailable',
          'JobTech is unavailable',
          undefined,
          { cause: error },
        );
      }
    }
    throw new JobTechError('unavailable', 'JobTech is unavailable');
  }
}
