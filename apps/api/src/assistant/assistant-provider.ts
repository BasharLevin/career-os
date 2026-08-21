import type { ToolName } from '@career-os/contracts';

export interface ProviderTool {
  name: ToolName;
  description: string;
  parameters: Record<string, unknown>;
}
export interface ProviderInput {
  instructions: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  tools: ProviderTool[];
  signal?: AbortSignal;
}
export interface ProviderResult {
  responseId: string | null;
  text: string;
  calls: Array<{ callId: string; name: string; arguments: string }>;
  followUp?: { type: 'reveal_results' | 'focus_result'; ordinal?: number };
}
export interface AssistantProvider {
  readonly mode: 'demo' | 'openai';
  respond(input: ProviderInput): Promise<ProviderResult>;
  synthesize?(input: {
    responseId: string;
    instructions: string;
    outputs: Array<{ callId: string; output: unknown }>;
    signal?: AbortSignal;
  }): Promise<string>;
}
export const ASSISTANT_PROVIDER = Symbol('ASSISTANT_PROVIDER');
