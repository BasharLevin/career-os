// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SaveJobButton } from './save-job-button';
vi.mock('./api', () => ({
  trackingApi: { save: vi.fn().mockResolvedValue({}) },
}));
describe('SaveJobButton', () => {
  it('announces the persisted state', async () => {
    render(<SaveJobButton externalId="job-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Save job' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Saved' })).toBeDisabled(),
    );
  });
});
