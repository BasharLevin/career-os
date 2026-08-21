import { describe, expect, it } from 'vitest';
import { OpenAiAssistantProvider } from './openai-assistant.provider.js';

describe.skipIf(process.env.OPENAI_LIVE_TEST !== 'true')(
  'live OpenAI Responses adapter',
  () => {
    it('returns a server-side Responses API result', async () => {
      const result = await new OpenAiAssistantProvider().respond({
        instructions: 'Reply with the single word ready.',
        messages: [{ role: 'user', content: 'Health check' }],
        tools: [],
      });
      expect(result.responseId).toBeTruthy();
      expect(result.text.length).toBeGreaterThan(0);
    }, 60_000);
  },
);
