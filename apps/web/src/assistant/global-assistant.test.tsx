// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CareerAssistantProvider } from './assistant-context';
import { GlobalAssistant } from './global-assistant';

vi.mock('next/navigation', () => ({ usePathname: () => '/profile' }));
beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    }),
  );
});
describe('global assistant', () => {
  it('opens without replacing the current page and labels the dialog', () => {
    render(
      <CareerAssistantProvider>
        <p>Profile page remains</p>
        <GlobalAssistant />
      </CareerAssistantProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ask CareerOS' }));
    expect(screen.getByText('Profile page remains')).toBeTruthy();
    expect(
      screen.getByRole('dialog', { name: 'CareerOS copilot' }),
    ).toBeTruthy();
  });
});
