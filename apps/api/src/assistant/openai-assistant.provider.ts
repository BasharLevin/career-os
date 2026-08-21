import { Injectable } from '@nestjs/common';
import { parseApiEnvironment } from '@career-os/config';
import OpenAI from 'openai';
import type {
  AssistantProvider,
  ProviderInput,
  ProviderResult,
} from './assistant-provider.js';

@Injectable()
export class OpenAiAssistantProvider implements AssistantProvider {
  private readonly client: OpenAI;
  constructor() {
    this.client = new OpenAI({
      apiKey: parseApiEnvironment(process.env).OPENAI_API_KEY,
    });
  }

  async respond(input: ProviderInput): Promise<ProviderResult> {
    const env = parseApiEnvironment(process.env);
    const response = await this.client.responses.create(
      {
        model: env.OPENAI_MODEL,
        store: false,
        instructions: input.instructions,
        input: input.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        tools: input.tools.map((tool) => ({
          type: 'function' as const,
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          strict: true,
        })),
        parallel_tool_calls: false,
        max_output_tokens: 1200,
      },
      { signal: input.signal },
    );
    const calls = response.output.flatMap((item) =>
      item.type === 'function_call'
        ? [{ callId: item.call_id, name: item.name, arguments: item.arguments }]
        : [],
    );
    return { responseId: response.id, text: response.output_text, calls };
  }
}
