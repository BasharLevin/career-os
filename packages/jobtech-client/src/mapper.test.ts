import { describe, expect, it } from 'vitest';
import { mapJobSummary } from './mapper.js';
import { upstreamJobSchema } from './schemas.js';

describe('JobTech mapping', () => {
  it('normalizes nullable fields and unsafe URLs', () => {
    const job = upstreamJobSchema.parse({
      id: 'safe-id',
      headline: null,
      webpage_url: 'javascript:alert(1)',
      workplace_address: null,
    });

    expect(mapJobSummary(job)).toMatchObject({
      headline: 'Untitled position',
      webpageUrl: null,
      employerName: null,
      location: { municipality: null, region: null },
    });
  });
});
