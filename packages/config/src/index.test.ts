import { describe, expect, it } from 'vitest';
import { parseApiEnvironment, parseWebEnvironment } from './index.js';

describe('environment parsing', () => {
  it('coerces a valid API port', () => {
    expect(parseApiEnvironment({ API_PORT: '4100' }).API_PORT).toBe(4100);
  });

  it('rejects an invalid API port', () => {
    expect(() => parseApiEnvironment({ API_PORT: '70000' })).toThrow();
  });

  it('rejects a non-URL public API boundary', () => {
    expect(() =>
      parseWebEnvironment({ NEXT_PUBLIC_API_BASE_URL: 'not-a-url' }),
    ).toThrow();
  });
});
