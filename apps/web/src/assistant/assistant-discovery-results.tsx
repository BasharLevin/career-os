'use client';
import React from 'react';
import { JobResults } from '../discovery/job-results';
import { useCareerAssistant } from './assistant-context';

export function AssistantDiscoveryResults({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = useCareerAssistant();
  if (!state.jobs.length) return children;
  return (
    <section aria-label="Assistant search results">
      <p className="results-summary" aria-live="polite">
        {state.jobs.length} ranked JobTech results from your CareerOS
        conversation
      </p>
      <JobResults jobs={state.jobs} focusedJobId={state.focus} />
    </section>
  );
}
