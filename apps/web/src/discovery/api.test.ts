import { afterEach, describe, expect, it, vi } from 'vitest';
import { jobSearchQuerySchema } from '@career-os/contracts';
import { searchJobs } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('CareerOS discovery API boundary', () => {
  it('rejects malformed API responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ jobs: 'invalid' })),
    );
    await expect(
      searchJobs(jobSearchQuerySchema.parse({ q: 'typescript' })),
    ).rejects.toThrow();
  });

  it('sends supported search parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        jobs: [],
        total: 0,
        offset: 0,
        limit: 20,
        hasMore: false,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await searchJobs(
      jobSearchQuerySchema.parse({ q: 'typescript', remote: true }),
    );
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('remote=true');
  });
});
