import { GatewayTimeoutException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { JobTechError, type JobTechClient } from '@career-os/jobtech-client';
import { jobSearchQuerySchema } from '@career-os/contracts';
import { DiscoveryService } from './discovery.service.js';
import { ResponseCache } from './response-cache.js';

describe('DiscoveryService', () => {
  it('translates upstream missing jobs', async () => {
    const client = {
      getJob: vi
        .fn()
        .mockRejectedValue(new JobTechError('not_found', 'missing')),
    };
    const service = new DiscoveryService(
      client as unknown as JobTechClient,
      new ResponseCache(1_000),
    );
    await expect(service.getJob('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('translates upstream timeouts', async () => {
    const client = {
      search: vi.fn().mockRejectedValue(new JobTechError('timeout', 'slow')),
    };
    const service = new DiscoveryService(
      client as unknown as JobTechClient,
      new ResponseCache(1_000),
    );
    await expect(
      service.search(jobSearchQuerySchema.parse({})),
    ).rejects.toBeInstanceOf(GatewayTimeoutException);
  });
});
