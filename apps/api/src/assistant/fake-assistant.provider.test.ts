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
});
