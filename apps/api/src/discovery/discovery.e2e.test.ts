/* eslint-disable @typescript-eslint/no-unsafe-argument -- Nest exposes its test HTTP server as any. */
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { JobTechClient } from '@career-os/jobtech-client';
import { DiscoveryModule } from './discovery.module.js';

describe('discovery HTTP boundary', () => {
  let app: INestApplication;
  const client = {
    autocomplete: vi.fn().mockResolvedValue({ suggestions: [] }),
    getJob: vi.fn(),
    search: vi.fn().mockResolvedValue({
      jobs: [],
      total: 0,
      offset: 0,
      limit: 20,
      hasMore: false,
    }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [DiscoveryModule],
    })
      .overrideProvider(JobTechClient)
      .useValue(client)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await app.close();
  });

  it('returns stable paginated search JSON', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/jobs?q=typescript')
      .expect(200);
    expect(response.text).toBe(
      JSON.stringify({
        jobs: [],
        total: 0,
        offset: 0,
        limit: 20,
        hasMore: false,
      }),
    );
    expect(client.search).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'typescript', limit: 20 }),
      expect.any(AbortSignal),
    );
  });

  it('returns structured validation errors', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/jobs?limit=101')
      .expect(400);
    expect(response.text).toContain('Invalid request parameters');
    expect(response.text).toContain('"issues"');
  });

  it('routes autocomplete before the job identifier route', async () => {
    await request(app.getHttpServer())
      .get('/v1/jobs/autocomplete?q=data')
      .expect(200, { suggestions: [] });
    expect(client.autocomplete).toHaveBeenCalledWith(
      'data',
      expect.any(AbortSignal),
    );
    expect(client.getJob).not.toHaveBeenCalled();
  });
});
