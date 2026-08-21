'use client';
import {
  jobSummarySchema,
  type AssistantStreamEvent,
  type JobSummary,
} from '@career-os/contracts';
import { z } from 'zod';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  confirmOperation,
  conversations,
  sendMessage,
  type Conversation,
} from './api';

export type ChatEntry = {
  id: string;
  role: 'user' | 'assistant' | 'activity' | 'error';
  text: string;
};
type Confirmation = { token: string; summary: string };
type AssistantState = {
  threads: Conversation[];
  active: string | undefined;
  entries: ChatEntry[];
  input: string;
  busy: boolean;
  openPanel: boolean;
  jobs: JobSummary[];
  focus: string | undefined;
  providerLabel: string | undefined;
  demo: boolean;
  confirmation: Confirmation | undefined;
  setInput(value: string): void;
  setOpenPanel(value: boolean): void;
  openConversation(id: string): Promise<void>;
  createConversation(): Promise<void>;
  submit(): Promise<void>;
  approve(): Promise<void>;
  cancel(): void;
  focusJob(id: string): void;
};
const Context = createContext<AssistantState | null>(null);

export function CareerAssistantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [threads, setThreads] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string>();
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [openPanel, setOpenPanel] = useState(false);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [focus, setFocus] = useState<string>();
  const [providerLabel, setProviderLabel] = useState<string>();
  const [demo, setDemo] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const abort = useRef<AbortController | undefined>(undefined);
  useEffect(() => {
    const stored = sessionStorage.getItem('careeros-assistant-view');
    if (stored) {
      try {
        const state: unknown = JSON.parse(stored);
        if (state && typeof state === 'object' && 'jobs' in state) {
          const parsed = z.array(jobSummarySchema).safeParse(state.jobs);
          if (parsed.success) setJobs(parsed.data);
        }
        if (
          state &&
          typeof state === 'object' &&
          'focus' in state &&
          typeof state.focus === 'string'
        )
          setFocus(state.focus);
      } catch {
        /* Invalid browser state is ignored safely. */
      }
    }
    void conversations.list().then(async ({ items }) => {
      setThreads(items);
      const preferred = sessionStorage.getItem('careeros-active-conversation');
      const first = items.find((item) => item.id === preferred) ?? items[0];
      if (first) await openConversation(first.id);
    });
  }, []);
  useEffect(() => {
    sessionStorage.setItem(
      'careeros-assistant-view',
      JSON.stringify({ jobs, focus }),
    );
  }, [jobs, focus]);
  async function openConversation(id: string) {
    const thread = await conversations.get(id);
    setActive(id);
    sessionStorage.setItem('careeros-active-conversation', id);
    setEntries(
      (thread.messages ?? [])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          text: m.content,
        })),
    );
    const stateMessage = [...(thread.messages ?? [])]
      .reverse()
      .find(
        (message) =>
          message.metadata !== null &&
          typeof message.metadata === 'object' &&
          'resultState' in message.metadata,
      );
    if (
      stateMessage?.metadata &&
      typeof stateMessage.metadata === 'object' &&
      'resultState' in stateMessage.metadata
    ) {
      const resultState = stateMessage.metadata.resultState;
      if (
        resultState &&
        typeof resultState === 'object' &&
        'jobs' in resultState
      ) {
        const parsed = z.array(jobSummarySchema).safeParse(resultState.jobs);
        if (parsed.success) setJobs(parsed.data);
        if (
          'selectedJobId' in resultState &&
          typeof resultState.selectedJobId === 'string'
        )
          setFocus(resultState.selectedJobId);
      }
    }
  }
  async function createConversation() {
    const thread = await conversations.create();
    setThreads((old) => [thread, ...old]);
    await openConversation(thread.id);
  }
  function handleEvent(value: AssistantStreamEvent) {
    if (value.type === 'provider_status') {
      setProviderLabel(value.label);
      setDemo(value.mode === 'demo');
    }
    if (value.type === 'text_delta')
      setEntries((old) => [
        ...old,
        { id: crypto.randomUUID(), role: 'assistant', text: value.text },
      ]);
    if (value.type === 'tool_started')
      setEntries((old) => [
        ...old,
        {
          id: crypto.randomUUID(),
          role: 'activity',
          text: `Working on ${value.label}…`,
        },
      ]);
    if (value.type === 'tool_completed') {
      if (value.jobs) setJobs(value.jobs);
      if (value.focusJobId) setFocus(value.focusJobId);
    }
    if (value.type === 'confirmation_required')
      setConfirmation({ token: value.token, summary: value.summary });
    if (value.type === 'error')
      setEntries((old) => [
        ...old,
        { id: crypto.randomUUID(), role: 'error', text: value.message },
      ]);
  }
  async function submit() {
    if (!active || !input.trim() || busy) return;
    const text = input.trim();
    setInput('');
    setEntries((old) => [
      ...old,
      { id: crypto.randomUUID(), role: 'user', text },
    ]);
    setBusy(true);
    abort.current = new AbortController();
    try {
      await sendMessage(
        active,
        text,
        crypto.randomUUID(),
        handleEvent,
        abort.current.signal,
      );
    } catch (error) {
      if (!abort.current.signal.aborted)
        setEntries((old) => [
          ...old,
          {
            id: crypto.randomUUID(),
            role: 'error',
            text:
              error instanceof Error
                ? error.message
                : 'CareerOS is unavailable',
          },
        ]);
    } finally {
      setBusy(false);
    }
  }
  async function approve() {
    if (!active || !confirmation) return;
    setBusy(true);
    try {
      await confirmOperation(active, confirmation.token, handleEvent);
      setConfirmation(undefined);
    } finally {
      setBusy(false);
    }
  }
  function cancel() {
    abort.current?.abort();
    setBusy(false);
  }
  return (
    <Context.Provider
      value={{
        threads,
        active,
        entries,
        input,
        busy,
        openPanel,
        jobs,
        focus,
        providerLabel,
        demo,
        confirmation,
        setInput,
        setOpenPanel,
        openConversation,
        createConversation,
        submit,
        approve,
        cancel,
        focusJob: setFocus,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCareerAssistant() {
  const value = useContext(Context);
  if (!value) throw new Error('CareerAssistantProvider is missing');
  return value;
}
