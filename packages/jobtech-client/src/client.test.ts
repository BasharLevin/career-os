import { describe, expect, it, vi } from 'vitest';
import { jobSearchQuerySchema } from '@career-os/contracts';
import { JobTechClient } from './client.js';

const syntheticJob = {
  id: 'job-123',
  headline: 'Platform Engineer',
  webpage_url: 'https://example.invalid/jobs/job-123',
  application_deadline: '2026-09-30T23:59:59',
  publication_date: '2026-08-21T08:00:00',
  number_of_vacancies: 2,
  description: { text: 'Build reliable systems. '.repeat(20) },
  employer: { name: 'Synthetic Employer' },
  application_details: { url: 'https://example.invalid/apply/job-123' },
  occupation: { concept_id: 'occupation-1', label: 'Software developer' },
  employment_type: { concept_id: 'type-1', label: 'Permanent' },
  working_hours_type: { concept_id: 'hours-1', label: 'Full time' },
  workplace_address: {
    municipality: 'Example municipality',
    region: 'Example region',
    country: 'Sweden',
    city: 'Example city',
  },
  salary_description: null,
  must_have: { skills: [{ concept_id: 'skill-1', label: 'TypeScript' }] },
  nice_to_have: { skills: [] },
};

describe('JobTechClient', () => {
  it('maps search results and forwards supported filters', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ total: { value: 25 }, hits: [syntheticJob] }),
      );
    const client = new JobTechClient({
      baseUrl: 'https://jobtech.example',
      fetch: fetchMock,
    });
    const query = jobSearchQuerySchema.parse({
      q: 'platform',
      limit: 20,
      remote: true,
      occupationField: 'data-it',
    });

    const result = await client.search(query);

    expect(result).toMatchObject({ total: 25, hasMore: true });
    expect(result.jobs[0]).toMatchObject({
      id: 'job-123',
      headline: 'Platform Engineer',
    });
    const requestedUrl = fetchMock.mock.calls[0]?.[0];
    expect(requestedUrl).toBeInstanceOf(URL);
    if (!(requestedUrl instanceof URL))
      throw new Error('Expected a URL request');
    expect(requestedUrl.href).toContain('remote=true');
    expect(requestedUrl.href).toContain('occupation-field=data-it');
  });

  it('validates and maps autocomplete responses', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        typeahead: [
          { value: 'data engineer', type: 'occupation', occurrences: 42 },
        ],
      }),
    );
    const client = new JobTechClient({
      baseUrl: 'https://jobtech.example',
      fetch: fetchMock,
    });

    await expect(client.autocomplete('data eng')).resolves.toEqual({
      suggestions: [
        { value: 'data engineer', type: 'occupation', occurrences: 42 },
      ],
    });
  });

  it('retries transient server failures and then succeeds', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json(syntheticJob));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const client = new JobTechClient({
      baseUrl: 'https://jobtech.example',
      fetch: fetchMock,
      maxRetries: 1,
      sleep,
    });

    await expect(client.getJob('job-123')).resolves.toMatchObject({
      id: 'job-123',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(100);
  });

  it('does not retry a missing job', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 404 }));
    const client = new JobTechClient({
      baseUrl: 'https://jobtech.example',
      fetch: fetchMock,
      maxRetries: 2,
    });

    await expect(client.getJob('missing')).rejects.toMatchObject({
      code: 'not_found',
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('rejects a malformed upstream job at the runtime boundary', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ id: 123 }));
    const client = new JobTechClient({
      baseUrl: 'https://jobtech.example',
      fetch: fetchMock,
    });

    await expect(client.getJob('job-123')).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });
});
