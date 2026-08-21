import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
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
});
