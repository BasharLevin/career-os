import {
  jobDetailSchema,
  jobIdSchema,
  jobSearchResponseSchema,
  type JobDetail,
  type JobSearchQuery,
  type JobSearchResponse,
} from '@career-os/contracts';
import { parseWebEnvironment } from '@career-os/config';

export class CareerOsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'CareerOsApiError';
  }
}

function apiUrl(path: string): URL {
  return new URL(
    path,
    parseWebEnvironment(process.env).NEXT_PUBLIC_API_BASE_URL,
  );
}

async function requestJson(url: URL): Promise<unknown> {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    next: { revalidate: 30 },
  });
  if (!response.ok)
    throw new CareerOsApiError('CareerOS API request failed', response.status);
  return response.json();
}

export async function searchJobs(
  query: JobSearchQuery,
): Promise<JobSearchResponse> {
  const url = apiUrl('/v1/jobs');
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return jobSearchResponseSchema.parse(await requestJson(url));
}

export async function getJob(id: string): Promise<JobDetail> {
  const parsedId = jobIdSchema.parse(id);
  return jobDetailSchema.parse(
    await requestJson(apiUrl(`/v1/jobs/${encodeURIComponent(parsedId)}`)),
  );
}
