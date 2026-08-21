// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { JobResults } from './job-results';

describe('JobResults', () => {
  it('renders accessible links and normalized metadata', () => {
    render(
      <JobResults
        jobs={[
          {
            id: 'job-1',
            headline: 'Platform Engineer',
            employerName: 'Example employer',
            location: {
              city: null,
              municipality: 'Stockholm',
              region: null,
              country: 'Sweden',
            },
            occupation: null,
            employmentType: null,
            publicationDate: null,
            applicationDeadline: null,
            webpageUrl: null,
            remote: null,
            descriptionExcerpt: 'Build reliable systems.',
          },
        ]}
      />,
    );
    expect(
      screen.getByRole('link', { name: 'Platform Engineer' }),
    ).toHaveAttribute('href', '/jobs/job-1');
    expect(screen.getByText('Stockholm')).toBeInTheDocument();
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<JobResults jobs={[]} />);
    const result = await axe.run(container);
    expect(result.violations).toEqual([]);
  });
});
