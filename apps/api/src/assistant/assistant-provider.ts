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
}
export interface AssistantProvider {
  respond(input: ProviderInput): Promise<ProviderResult>;
}
export const ASSISTANT_PROVIDER = Symbol('ASSISTANT_PROVIDER');
