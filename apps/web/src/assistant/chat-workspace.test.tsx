// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatWorkspace } from './chat-workspace';
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    }),
  );
});
describe('chat workspace', () => {
  it('provides accessible empty, navigation and composer states', () => {
    render(<ChatWorkspace />);
    expect(
      screen.getByRole('heading', { name: 'Plan the next move' }),
    ).toBeTruthy();
    expect(screen.getByLabelText('Message CareerOS')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'New conversation' }),
    ).toBeTruthy();
  });
});
