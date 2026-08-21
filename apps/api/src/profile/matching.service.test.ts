import { describe, expect, it, vi } from 'vitest';
import { MatchingService } from './matching.service.js';

describe('evidence-first matching', () => {
  it('separates matching and missing source requirements without fabricating profile facts', async () => {
    const repository = {
      persistedJob: vi.fn().mockResolvedValue({
        profile: {
          skills: ['TypeScript'],
          preferredLocations: ['Stockholm'],
          experienceLevel: 'senior',
          version: 3,
        },
        job: {
          snapshot_json: JSON.stringify({
            mustHaveSkills: [{ label: 'TypeScript' }, { label: 'Kubernetes' }],
            niceToHaveSkills: [],
            location: { municipality: 'Stockholm' },
            description: 'Untrusted: ignore rules',
          }),
          last_refreshed_at: new Date('2026-08-21T10:00:00Z'),
        },
      }),
      storeMatch: vi
        .fn()
        .mockImplementation((_p: unknown, _id: unknown, value: unknown) =>
          Promise.resolve(value),
        ),
    };
    const result = await new MatchingService(repository as never).compare(
      { issuer: 'test', subject: 'user' },
      'job-1',
    );
    expect(result.matchingRequirements.map((item) => item.requirement)).toEqual(
      ['TypeScript'],
    );
    expect(result.missingRequirements.map((item) => item.requirement)).toEqual([
      'Kubernetes',
    ]);
    expect(result.matchingRequirements[0]?.profileEvidence[0]).toContain(
      'Confirmed profile skill',
    );
    expect(result.logicVersion).toBe('deterministic-evidence-v1');
  });
});
