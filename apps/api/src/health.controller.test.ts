import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from '@career-os/contracts';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('returns a valid API liveness response', () => {
    const result = new HealthController().live();
    expect(healthResponseSchema.parse(result).service).toBe('api');
  });
});
