import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from './health.js';

describe('healthResponseSchema', () => {
  it('accepts the operational service contract', () => {
    expect(
      healthResponseSchema.parse({
        service: 'api',
        status: 'ok',
        timestamp: '2026-08-21T12:00:00.000Z',
        version: '0.1.0',
      }),
    ).toBeDefined();
  });

  it('rejects an unknown service', () => {
    expect(() =>
      healthResponseSchema.parse({
        service: 'database',
        status: 'ok',
        timestamp: '2026-08-21T12:00:00.000Z',
        version: '0.1.0',
      }),
    ).toThrow();
  });
});
