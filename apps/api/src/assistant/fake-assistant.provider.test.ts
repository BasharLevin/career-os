import { describe, expect, it } from 'vitest';
import { FakeAssistantProvider } from './fake-assistant.provider.js';
import type { ProviderTool } from './assistant-provider.js';
const tools: ProviderTool[] = [];
describe('deterministic assistant provider', () => {
  it.each([
    ['Search for TypeScript jobs', 'search_jobs'],
    ['Sök jobb i Stockholm', 'search_jobs'],
    ['Save job 31375817', 'save_job'],
    ['Spara jobb 31375817', 'save_job'],
  ])('selects the expected tool for %s', async (content, expected) => {
    const result = await new FakeAssistantProvider().respond({
      instructions: '',
      messages: [{ role: 'user', content }],
      tools,
    });
    expect(result.calls[0]?.name).toBe(expected);
  });
  it('does not send conversational command words to JobTech', async () => {
    const result = await new FakeAssistantProvider().respond({
      instructions: '',
      messages: [{ role: 'user', content: 'search' }],
      tools,
    });
    expect(JSON.parse(result.calls[0]?.arguments ?? '{}')).toEqual({
      limit: 10,
    });
  });
  it.each([
    ['show me', 'reveal_results', undefined],
    ['show me the second one', 'focus_result', 2],
    ['visa mig den andra', 'focus_result', 2],
  ])('resolves follow-up %s', async (content, type, ordinal) => {
    const result = await new FakeAssistantProvider().respond({
      instructions: '',
      messages: [{ role: 'user', content }],
      tools,
    });
    expect(result.followUp).toEqual({ type, ...(ordinal ? { ordinal } : {}) });
  });
  it('turns a location correction into structured criteria', async () => {
    const result = await new FakeAssistantProvider().respond({
      instructions: '',
      messages: [{ role: 'user', content: 'what about Västerås instead?' }],
      tools,
    });
    expect(JSON.parse(result.calls[0]?.arguments ?? '{}')).toMatchObject({
      municipality: 'Västerås',
    });
  });
});
