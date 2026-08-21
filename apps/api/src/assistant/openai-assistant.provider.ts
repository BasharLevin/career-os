import { Injectable } from '@nestjs/common';
import { ServiceUnavailableException } from '@nestjs/common';
import { parseApiEnvironment } from '@career-os/config';
import OpenAI from 'openai';
import type { ResponseInputItem } from 'openai/resources/responses/responses';
import type {
  AssistantProvider,
  ProviderInput,
  ProviderResult,
} from './assistant-provider.js';

@Injectable()
export class OpenAiAssistantProvider implements AssistantProvider {
  readonly mode = 'openai' as const;
  private readonly client: OpenAI;
  private readonly continuations = new Map<string, ResponseInputItem[]>();
  constructor() {
    this.client = new OpenAI({
      apiKey: parseApiEnvironment(process.env).OPENAI_API_KEY,
    });
  }

  async respond(input: ProviderInput): Promise<ProviderResult> {
    const env = parseApiEnvironment(process.env);
    try {
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
          ? [
              {
                callId: item.call_id,
                name: item.name,
                arguments: item.arguments,
              },
            ]
          : [],
      );
      if (calls.length)
        this.continuations.set(
          response.id,
          response.output.flatMap((item) =>
            item.type === 'function_call' || item.type === 'reasoning'
              ? [item]
              : [],
          ),
        );
      return { responseId: response.id, text: response.output_text, calls };
    } catch {
      throw new ServiceUnavailableException(
        'The live CareerOS copilot is temporarily unavailable. Your conversation is saved; no demo response was substituted.',
      );
    }
  }
  async synthesize(input: {
    responseId: string;
    instructions: string;
    outputs: Array<{ callId: string; output: unknown }>;
    signal?: AbortSignal;
  }): Promise<string> {
    const prior = this.continuations.get(input.responseId);
    if (!prior)
      throw new ServiceUnavailableException(
        'The live CareerOS copilot could not continue this response.',
      );
    this.continuations.delete(input.responseId);
    const toolOutputs: ResponseInputItem[] = input.outputs.map((item) => ({
      type: 'function_call_output',
      call_id: item.callId,
      output: JSON.stringify(item.output),
    }));
    try {
      const response = await this.client.responses.create(
        {
          model: parseApiEnvironment(process.env).OPENAI_MODEL,
          store: false,
          instructions: input.instructions,
          input: [...prior, ...toolOutputs],
          max_output_tokens: 1200,
        },
        { signal: input.signal },
      );
      return response.output_text;
    } catch {
      throw new ServiceUnavailableException(
        'The live CareerOS copilot is temporarily unavailable. Tool results were saved; no demo response was substituted.',
      );
    }
  }
}
