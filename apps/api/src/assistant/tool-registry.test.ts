import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ToolRegistry } from './tool-registry.js';

describe('assistant tool schemas', () => {
  const registry = new ToolRegistry(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  it('rejects malformed JSON and unknown fields', () => {
    expect(() => registry.parse('save_job', '{')).toThrow(BadRequestException);
    expect(() =>
      registry.parse(
        'save_job',
        JSON.stringify({ externalId: '123', userId: 'victim' }),
      ),
    ).toThrow(BadRequestException);
  });
  it('marks every mutating tool for confirmation', () => {
    for (const name of [
      'save_job',
      'create_application',
      'update_application_status',
      'add_application_note',
      'update_profile_preferences',
    ] as const)
      expect(registry.isMutating(name)).toBe(true);
    expect(registry.isMutating('search_jobs')).toBe(false);
  });
  it('publishes strict closed object schemas', () => {
    expect(
      registry
        .definitions()
        .every((tool) => tool.parameters.additionalProperties === false),
    ).toBe(true);
  });
  it('asks for a material criterion instead of searching the entire market', async () => {
    const discovery = { search: vi.fn() };
    const profiles = {
      get: vi.fn().mockResolvedValue({
        preferredRoles: [],
        preferredLocations: [],
        skills: [],
      }),
    };
    const result = await new ToolRegistry(
      discovery as never,
      {} as never,
      profiles as never,
      {} as never,
    ).execute(
      'search_jobs',
      { offset: 0, limit: 10 },
      { issuer: 'test', subject: 'owner' },
      'correlation',
    );
    expect(discovery.search).not.toHaveBeenCalled();
    expect(result).toMatchObject({ jobs: [], strict: true });
  });
  it('keeps only explicit early-career evidence for a junior search', async () => {
    const jobs = [
      {
        id: '1',
        headline: 'Executive Search Consultant',
        descriptionExcerpt: 'Mentor junior colleagues',
        location: { city: 'Stockholm', municipality: 'Stockholm' },
        publicationDate: '2026-08-20T10:00:00Z',
      },
      {
        id: '2',
        headline: 'Junior TypeScript Developer',
        descriptionExcerpt: 'Graduate role',
        location: { city: 'Stockholm', municipality: 'Stockholm' },
        publicationDate: '2026-08-20T10:00:00Z',
      },
    ];
    const discovery = {
      search: vi.fn().mockResolvedValue({
        jobs,
        total: 2,
        offset: 0,
        limit: 20,
        hasMore: false,
      }),
    };
    const profiles = {
      get: vi.fn().mockResolvedValue({
        preferredRoles: [],
        preferredLocations: [],
        skills: ['TypeScript'],
      }),
    };
    const result = await new ToolRegistry(
      discovery as never,
      {} as never,
      profiles as never,
      {} as never,
    ).execute(
      'search_jobs',
      { q: 'junior', offset: 0, limit: 10 },
      { issuer: 'test', subject: 'owner' },
      'correlation',
    );
    expect(result).toMatchObject({ jobs: [{ id: '2' }] });
  });
});
