'use client';
import React from 'react';
import { useState } from 'react';
import { trackingApi } from './api';

export function SaveJobButton({ externalId }: { externalId: string }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  return (
    <button
      className="quiet-button"
      disabled={state === 'saving' || state === 'saved'}
      onClick={() =>
        void (async () => {
          setState('saving');
          try {
            await trackingApi.save(externalId);
            setState('saved');
          } catch {
            setState('error');
          }
        })()
      }
      type="button"
      aria-live="polite"
    >
      {state === 'saving'
        ? 'Saving…'
        : state === 'saved'
          ? 'Saved'
          : state === 'error'
            ? 'Try saving again'
            : 'Save job'}
    </button>
  );
}
export function CreateApplicationButton({
  externalId,
}: {
  externalId: string;
}) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  return (
    <button
      disabled={state === 'saving' || state === 'saved'}
      onClick={() =>
        void (async () => {
          setState('saving');
          try {
            await trackingApi.create(externalId);
            setState('saved');
          } catch {
            setState('error');
          }
        })()
      }
      type="button"
      aria-live="polite"
    >
      {state === 'saving'
        ? 'Creating…'
        : state === 'saved'
          ? 'Added to applications'
          : state === 'error'
            ? 'Try again'
            : 'Track application'}
    </button>
  );
}
