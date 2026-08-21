import { describe, expect, it } from 'vitest';
import { parseApiEnvironment, parseWebEnvironment } from './index.js';

describe('environment parsing', () => {
  it('coerces a valid API port', () => {
    expect(parseApiEnvironment({ API_PORT: '4100' }).API_PORT).toBe(4100);
  });

  it('rejects an invalid API port', () => {
    expect(() => parseApiEnvironment({ API_PORT: '70000' })).toThrow();
  });

  it('provides bounded JobTech resilience defaults', () => {
    expect(parseApiEnvironment({})).toMatchObject({
      JOBTECH_REQUEST_TIMEOUT_MS: 5000,
      JOBTECH_MAX_RETRIES: 2,
      JOBTECH_CACHE_TTL_SECONDS: 60,
    });
  });

  it('rejects a non-URL public API boundary', () => {
    expect(() =>
      parseWebEnvironment({ NEXT_PUBLIC_API_BASE_URL: 'not-a-url' }),
    ).toThrow();
  });
  it('fails closed when local identity or unencrypted SQL is selected in production', () => {
    expect(() => parseApiEnvironment({ NODE_ENV: 'production' })).toThrow();
    expect(() =>
      parseApiEnvironment({
        NODE_ENV: 'production',
        AUTH_MODE: 'jwks',
        AUTH_JWKS_URL: 'https://identity.example/jwks',
      }),
    ).toThrow('encrypted');
  });
  it('requires the live provider in production and accepts explicit demo mode locally', () => {
    expect(parseApiEnvironment({ AI_PROVIDER: 'fake' }).AI_PROVIDER).toBe(
      'fake',
    );
    expect(() =>
      parseApiEnvironment({
        NODE_ENV: 'production',
        AUTH_MODE: 'jwks',
        AUTH_JWKS_URL: 'https://identity.example/jwks',
        DATABASE_ENCRYPT: 'true',
        AI_PROVIDER: 'fake',
        ASSISTANT_CONFIRMATION_SECRET:
          'production-secret-that-is-long-and-unique',
      }),
    ).toThrow('AI_PROVIDER=openai');
  });
});
