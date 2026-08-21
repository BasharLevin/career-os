import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import { DiscoveryController } from './discovery.controller.js';
import type { DiscoveryService } from './discovery.service.js';

const request = { once: vi.fn() } as unknown as Request;

describe('DiscoveryController', () => {
  it('rejects invalid pagination before calling the service', () => {
    const service = { search: vi.fn() };
    const controller = new DiscoveryController(
      service as unknown as DiscoveryService,
    );
    expect(() => controller.search({ limit: '101' }, request)).toThrow(
      BadRequestException,
    );
    expect(service.search).not.toHaveBeenCalled();
  });

  it('passes parsed search values to the service', async () => {
    const service = {
      search: vi.fn().mockResolvedValue({ jobs: [], total: 0 }),
    };
    const controller = new DiscoveryController(
      service as unknown as DiscoveryService,
    );
    await controller.search({ q: ' TypeScript ', remote: 'true' }, request);
    expect(service.search).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'TypeScript', remote: true, limit: 20 }),
      expect.any(AbortSignal),
    );
  });
});
