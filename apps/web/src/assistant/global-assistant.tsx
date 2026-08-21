'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { ChatWorkspace } from './chat-workspace';
import { useCareerAssistant } from './assistant-context';

export function GlobalAssistant() {
  const state = useCareerAssistant();
  const pathname = usePathname();
  if (pathname === '/assistant') return null;
  return (
    <aside
      className={state.openPanel ? 'global-assistant open' : 'global-assistant'}
      aria-label="CareerOS copilot"
    >
      <button
        className="assistant-dock"
        aria-expanded={state.openPanel}
        aria-controls="career-assistant-panel"
        onClick={() => state.setOpenPanel(!state.openPanel)}
      >
        {state.openPanel ? 'Close copilot' : 'Ask CareerOS'}
      </button>
      {state.openPanel && (
        <div
          id="career-assistant-panel"
          role="dialog"
          aria-label="CareerOS copilot"
        >
          <ChatWorkspace compact />
        </div>
      )}
    </aside>
  );
}
