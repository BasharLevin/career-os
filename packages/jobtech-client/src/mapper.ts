import type { JobDetail, JobSummary } from '@career-os/contracts';
import type { UpstreamJob } from './schemas.js';

function taxonomy(item: UpstreamJob['occupation']) {
  if (!item) return null;
  return { conceptId: item.concept_id ?? null, label: item.label ?? null };
}

function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function excerpt(value: string | null | undefined): string | null {
  if (!value) return null;
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > 240 ? `${compact.slice(0, 237)}…` : compact;
}

export function mapJobSummary(job: UpstreamJob): JobSummary {
  return {
    id: job.id,
    headline: job.headline?.trim() || 'Untitled position',
    employerName: job.employer?.name?.trim() || null,
    location: {
      municipality: job.workplace_address?.municipality ?? null,
      region: job.workplace_address?.region ?? null,
      country: job.workplace_address?.country ?? null,
      city: job.workplace_address?.city ?? null,
    },
    occupation: taxonomy(job.occupation),
    employmentType: taxonomy(job.employment_type),
    publicationDate: job.publication_date ?? null,
    applicationDeadline: job.application_deadline ?? null,
    webpageUrl: safeUrl(job.webpage_url),
    remote: null,
    descriptionExcerpt: excerpt(job.description?.text),
  };
}

export function mapJobDetail(job: UpstreamJob): JobDetail {
  return {
    ...mapJobSummary(job),
    description: job.description?.text?.trim() || null,
    numberOfVacancies: job.number_of_vacancies ?? null,
    salaryDescription: job.salary_description?.trim() || null,
    workingHoursType: taxonomy(job.working_hours_type),
    applicationUrl: safeUrl(job.application_details?.url),
    mustHaveSkills: (job.must_have?.skills ?? [])
      .map(taxonomy)
      .filter((item) => item !== null),
    niceToHaveSkills: (job.nice_to_have?.skills ?? [])
      .map(taxonomy)
      .filter((item) => item !== null),
  };
}
