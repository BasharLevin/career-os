import { describe, expect, it } from 'vitest';
import { normalizeCorrelationId } from './request-logging.middleware.js';

describe('correlation IDs', () => {
  it('preserves a safe caller-provided identifier', () => {
    expect(normalizeCorrelationId('request-123')).toBe('request-123');
  });

  it('replaces values that could poison structured logs', () => {
    const normalized = normalizeCorrelationId('bad\n{"forged":true}');
    expect(normalized).toMatch(/^[0-9a-f-]{36}$/);
  });
});
