'use client';
import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useCareerAssistant } from './assistant-context';

export function ChatWorkspace({ compact = false }: { compact?: boolean }) {
  const state = useCareerAssistant();
  const reduced = useReducedMotion();
  const messages = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = messages.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [state.entries, reduced]);
  return (
    <main className={`assistant-shell ${compact ? 'compact' : ''}`}>
      {!compact && (
        <aside className="conversation-list">
          <button onClick={() => void state.createConversation()}>
            New conversation
          </button>
          {state.threads.map((thread) => (
            <button
              className={thread.id === state.active ? 'selected' : ''}
              key={thread.id}
              onClick={() => void state.openConversation(thread.id)}
            >
              {thread.title}
            </button>
          ))}
        </aside>
      )}
      <section className="chat-panel">
        <header>
          <p className="eyebrow">CareerOS copilot</p>
          {!compact && <h1>Plan the next move</h1>}
          {state.providerLabel && (
            <span
              className={state.demo ? 'provider-mode demo' : 'provider-mode'}
            >
              {state.providerLabel}
            </span>
          )}
        </header>
        <div className="messages" aria-live="polite" ref={messages}>
          {!state.entries.length && (
            <p className="empty">
              Ask naturally in English or Swedish. I’ll use your approved
              profile when it helps.
            </p>
          )}
          {state.entries.map((entry) => (
            <div key={entry.id} className={`message ${entry.role}`}>
              {entry.text}
            </div>
          ))}
        </div>
        {state.jobs.length > 0 && (
          <section
            className="assistant-job-cards"
            aria-label="Jobs from the assistant"
          >
            {state.jobs.slice(0, compact ? 4 : 8).map((job, index) => (
              <motion.article
                key={job.id}
                className={
                  job.id === state.focus
                    ? 'assistant-job selected'
                    : 'assistant-job'
                }
                animate={{
                  opacity: job.id === state.focus ? 1 : 0.72,
                  scale: job.id === state.focus ? 1.02 : 1,
                }}
                transition={{ duration: reduced ? 0 : 0.18 }}
              >
                <button
                  onClick={() => state.focusJob(job.id)}
                  aria-label={`Focus result ${index + 1}: ${job.headline}`}
                >
                  <span>{index + 1}</span>
                  <strong>{job.headline}</strong>
                  <small>
                    {job.location.city ??
                      job.location.municipality ??
                      'Location not specified'}
                  </small>
                </button>
                <a href={`/jobs/${encodeURIComponent(job.id)}`}>Open details</a>
              </motion.article>
            ))}
          </section>
        )}
        {state.confirmation && (
          <div className="confirmation" role="alert">
            <p>{state.confirmation.summary}</p>
            <button disabled={state.busy} onClick={() => void state.approve()}>
              Confirm once
            </button>
            <button onClick={() => state.setOpenPanel(false)}>Cancel</button>
          </div>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void state.submit();
          }}
        >
          <label
            htmlFor={compact ? 'global-assistant-message' : 'assistant-message'}
          >
            Message CareerOS
          </label>
          <textarea
            id={compact ? 'global-assistant-message' : 'assistant-message'}
            value={state.input}
            onChange={(event) => state.setInput(event.target.value)}
            disabled={!state.active || state.busy}
          />
          <div>
            <button
              disabled={!state.active || state.busy || !state.input.trim()}
            >
              Send
            </button>
            {state.busy && (
              <button type="button" onClick={() => state.cancel()}>
                Cancel response
              </button>
            )}
          </div>
        </form>
      </section>
      {!compact && (
        <motion.aside
          className="focused-job"
          animate={{
            scale: state.focus ? 1 : 0.96,
            opacity: state.focus ? 1 : 0.55,
          }}
          transition={{ duration: reduced ? 0 : 0.2 }}
        >
          <h2>Focused job</h2>
          {state.focus ? (
            <>
              <strong>
                {state.jobs.find((job) => job.id === state.focus)?.headline ??
                  `Job ${state.focus}`}
              </strong>
              <a href={`/jobs/${state.focus}`}>Open expanded details</a>
            </>
          ) : (
            <p>A discussed job will move here.</p>
          )}
        </motion.aside>
      )}
    </main>
  );
}
