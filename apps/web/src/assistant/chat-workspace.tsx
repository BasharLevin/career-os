'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AssistantStreamEvent } from '@career-os/contracts';
import {
  confirmOperation,
  conversations,
  sendMessage,
  type Conversation,
} from './api';

type Entry = {
  id: string;
  role: 'user' | 'assistant' | 'activity' | 'error';
  text: string;
};
export function ChatWorkspace() {
  const reduced = useReducedMotion();
  const [threads, setThreads] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string>();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState<string>();
  const [confirmation, setConfirmation] = useState<{
    token: string;
    summary: string;
  }>();
  const abort = useRef<AbortController | undefined>(undefined);
  useEffect(() => {
    void conversations.list().then(({ items }) => {
      setThreads(items);
      if (items[0]) void open(items[0].id);
    });
  }, []);
  async function open(id: string) {
    const thread = await conversations.get(id);
    setActive(id);
    setEntries(
      (thread.messages ?? [])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          text: m.content,
        })),
    );
  }
  async function create() {
    const thread = await conversations.create();
    setThreads((old) => [thread, ...old]);
    await open(thread.id);
  }
  function event(value: AssistantStreamEvent) {
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
    if (value.type === 'tool_completed' && value.focusJobId)
      setFocus(value.focusJobId);
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
        event,
        abort.current.signal,
      );
    } catch (error) {
      if (!abort.current.signal.aborted)
        setEntries((old) => [
          ...old,
          {
            id: crypto.randomUUID(),
            role: 'error',
            text: error instanceof Error ? error.message : 'Request failed',
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
      await confirmOperation(active, confirmation.token, event);
      setConfirmation(undefined);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="assistant-shell">
      <aside className="conversation-list">
        <button onClick={() => void create()}>New conversation</button>
        {threads.map((thread) => (
          <button
            className={thread.id === active ? 'selected' : ''}
            key={thread.id}
            onClick={() => void open(thread.id)}
          >
            {thread.title}
          </button>
        ))}
      </aside>
      <section className="chat-panel">
        <header>
          <p className="eyebrow">CareerOS assistant</p>
          <h1>Plan the next move</h1>
          <p>
            Evidence-backed job discovery and application help. Changes always
            ask first.
          </p>
        </header>
        <div className="messages" aria-live="polite">
          {!entries.length && (
            <p className="empty">
              Ask in English or Swedish: “Find TypeScript jobs in Stockholm” or
              “Jämför jobb 31375817 med min profil.”
            </p>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className={`message ${entry.role}`}>
              {entry.text}
            </div>
          ))}
        </div>
        {confirmation && (
          <div className="confirmation" role="alert">
            <p>{confirmation.summary}</p>
            <button disabled={busy} onClick={() => void approve()}>
              Confirm once
            </button>
            <button onClick={() => setConfirmation(undefined)}>Cancel</button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label htmlFor="assistant-message">Message CareerOS</label>
          <textarea
            id="assistant-message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!active || busy}
          />
          <div>
            <button disabled={!active || busy || !input.trim()}>Send</button>
            {busy && (
              <button type="button" onClick={() => abort.current?.abort()}>
                Cancel response
              </button>
            )}
          </div>
        </form>
      </section>
      <motion.aside
        className="focused-job"
        animate={{ scale: focus ? 1 : 0.96, opacity: focus ? 1 : 0.55 }}
        transition={{ duration: reduced ? 0 : 0.2 }}
      >
        <h2>Focused job</h2>
        {focus ? (
          <>
            <strong>Job {focus}</strong>
            <a href={`/jobs/${focus}`}>Open expanded details</a>
          </>
        ) : (
          <p>A job discussed by the assistant will move here.</p>
        )}
      </motion.aside>
    </main>
  );
}
