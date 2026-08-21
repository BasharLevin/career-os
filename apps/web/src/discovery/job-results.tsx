'use client';

import type { JobSummary } from '@career-os/contracts';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import React from 'react';
import { SaveJobButton } from '../tracking/save-job-button';

function locationLabel(job: JobSummary): string {
  return (
    job.location.city ??
    job.location.municipality ??
    job.location.region ??
    job.location.country ??
    'Unspecified'
  );
}

export function JobResults({ jobs }: { jobs: JobSummary[] }) {
  const reducedMotion = useReducedMotion();
  return (
    <div className="job-grid">
      {jobs.map((job, index) => (
        <motion.article
          animate={{ opacity: 1, y: 0 }}
          className="job-card"
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          key={job.id}
          transition={{
            delay: reducedMotion ? 0 : Math.min(index * 0.035, 0.25),
          }}
        >
          <div className="job-meta">
            <span>{job.employerName ?? 'Employer not specified'}</span>
            <span>{locationLabel(job)}</span>
            {job.employmentType?.label ? (
              <span>{job.employmentType.label}</span>
            ) : null}
          </div>
          <SaveJobButton externalId={job.id} />
          <h2>
            <Link href={`/jobs/${encodeURIComponent(job.id)}`}>
              {job.headline}
            </Link>
          </h2>
          {job.descriptionExcerpt ? <p>{job.descriptionExcerpt}</p> : null}
          <div className="job-meta">
            {job.publicationDate ? (
              <span>Published {job.publicationDate.slice(0, 10)}</span>
            ) : null}
            {job.applicationDeadline ? (
              <span>Apply by {job.applicationDeadline.slice(0, 10)}</span>
            ) : null}
          </div>
        </motion.article>
      ))}
    </div>
  );
}
