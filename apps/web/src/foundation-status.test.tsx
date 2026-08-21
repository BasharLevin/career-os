// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { FoundationStatus } from './foundation-status';

describe('FoundationStatus', () => {
  it('communicates the functional Phase 0 services', () => {
    render(<FoundationStatus />);
    expect(screen.getByText('Next.js + Framer Motion')).toBeInTheDocument();
    expect(screen.getByText('NestJS API + worker')).toBeInTheDocument();
    expect(screen.getByText('Runtime-validated')).toBeInTheDocument();
  });
});
