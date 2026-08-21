import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CareerOsApiError, getJob } from '../../../src/discovery/api';
import {
  CreateApplicationButton,
  SaveJobButton,
} from '../../../src/tracking/save-job-button';

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let job;
  try {
    job = await getJob(id);
  } catch (error) {
    if (error instanceof CareerOsApiError && error.status === 404) notFound();
    throw error;
  }
  const location =
    job.location.city ??
    job.location.municipality ??
    job.location.region ??
    job.location.country;

  return (
    <main>
      <div className="shell">
        <header className="topbar">
          <Link className="brand" href="/">
            CareerOS
          </Link>
          <Link href="/discover">Back to discovery</Link>
        </header>
        <div className="detail-grid">
          <article>
            <p className="eyebrow">
              {job.occupation?.label ?? 'Current opportunity'}
            </p>
            <h1>{job.headline}</h1>
            <div className="job-meta">
              <span>{job.employerName ?? 'Employer not specified'}</span>
              {location ? <span>{location}</span> : null}
              {job.applicationDeadline ? (
                <span>Apply by {job.applicationDeadline.slice(0, 10)}</span>
              ) : null}
            </div>
            <h2>About the role</h2>
            <p className="detail-copy">
              {job.description ?? 'No description was supplied.'}
            </p>
          </article>
          <aside className="detail-sidebar" aria-label="Job facts">
            <h2>Job facts</h2>
            {job.employmentType?.label ? (
              <p>{job.employmentType.label}</p>
            ) : null}
            {job.workingHoursType?.label ? (
              <p>{job.workingHoursType.label}</p>
            ) : null}
            {job.numberOfVacancies ? (
              <p>{job.numberOfVacancies} vacancies</p>
            ) : null}
            {job.mustHaveSkills.length ? (
              <>
                <h3>Required skills</h3>
                <ul className="skill-list">
                  {job.mustHaveSkills.map((skill) => (
                    <li key={skill.conceptId ?? skill.label}>{skill.label}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {(job.applicationUrl ?? job.webpageUrl) ? (
              <a
                className="primary-link"
                href={job.applicationUrl ?? job.webpageUrl ?? undefined}
                rel="noopener noreferrer"
                target="_blank"
              >
                View original listing
              </a>
            ) : null}
            <SaveJobButton externalId={job.id} />
            <CreateApplicationButton externalId={job.id} />
          </aside>
        </div>
      </div>
    </main>
  );
}
