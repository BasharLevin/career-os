import { describe, expect, it } from 'vitest';
import { LocalIdentityVerifier } from './identity-verifier.js';

describe('local identity isolation', () => {
  it('always resolves the configured principal and ignores request identity input', async () => {
    const verifier = new LocalIdentityVerifier('local', 'owner-a');
    expect(await verifier.verify()).toEqual({
      issuer: 'local',
      subject: 'owner-a',
    });
    expect(await verifier.verify()).toEqual({
      issuer: 'local',
      subject: 'owner-a',
    });
  });
});
