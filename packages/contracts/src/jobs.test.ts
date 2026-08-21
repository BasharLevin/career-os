import { describe, expect, it } from 'vitest';
import {
  autocompleteQuerySchema,
  jobIdSchema,
  jobSearchQuerySchema,
} from './jobs.js';

describe('discovery contracts', () => {
  it('coerces safe pagination and boolean query values', () => {
    expect(
      jobSearchQuerySchema.parse({ limit: '25', offset: '50', remote: 'true' }),
    ).toMatchObject({
      limit: 25,
      offset: 50,
      remote: true,
    });
  });

  it('rejects upstream pagination beyond the supported window', () => {
    expect(() => jobSearchQuerySchema.parse({ limit: 101 })).toThrow();
  });

  it('requires useful autocomplete input', () => {
    expect(() => autocompleteQuerySchema.parse({ q: 'x' })).toThrow();
  });

  it('rejects path traversal as a job identifier', () => {
    expect(() => jobIdSchema.parse('../secret')).toThrow();
  });
});
