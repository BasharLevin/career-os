import type { AssistantStreamEvent } from '@career-os/contracts';
const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${base}/api/v1${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}
export interface Conversation {
  id: string;
  title: string;
  messages?: Array<{
    id: string;
    role: string;
    kind: string;
    content: string;
    metadata?: unknown;
    createdAt: string;
  }>;
}
export const conversations = {
  list: () => json<{ items: Conversation[] }>('/conversations'),
  create: (title?: string) =>
    json<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  get: (id: string) => json<Conversation>(`/conversations/${id}`),
};
async function stream(
  path: string,
  body: unknown,
  onEvent: (event: AssistantStreamEvent) => void,
  signal?: AbortSignal,
) {
  const response = await fetch(`${base}/api/v1${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  });
  if (!response.ok || !response.body)
    throw new Error(`Assistant failed (${response.status})`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    buffer += decoder.decode(result.value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    for (const frame of frames) {
      const line = frame
        .split('\n')
        .find((value) => value.startsWith('data: '));
      if (line) onEvent(JSON.parse(line.slice(6)) as AssistantStreamEvent);
    }
  }
}
export const sendMessage = (
  id: string,
  content: string,
  clientMessageId: string,
  onEvent: (event: AssistantStreamEvent) => void,
  signal?: AbortSignal,
) =>
  stream(
    `/conversations/${id}/messages`,
    { content, clientMessageId },
    onEvent,
    signal,
  );
export const confirmOperation = (
  id: string,
  token: string,
  onEvent: (event: AssistantStreamEvent) => void,
) => stream(`/conversations/${id}/confirm`, { token, approved: true }, onEvent);
