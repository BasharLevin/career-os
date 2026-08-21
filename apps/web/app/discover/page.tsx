import {
  jobSearchQuerySchema,
  type JobSearchQuery,
} from '@career-os/contracts';
import { parseWebEnvironment } from '@career-os/config';
import Link from 'next/link';
import { JobResults } from '../../src/discovery/job-results';
import { SearchForm } from '../../src/discovery/search-form';
import { searchJobs } from '../../src/discovery/api';
import { AssistantDiscoveryResults } from '../../src/assistant/assistant-discovery-results';

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function paginationUrl(query: JobSearchQuery, offset: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, offset })) {
    if (value !== undefined) params.set(key, String(value));
  }
  return `/discover?${params.toString()}`;
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;
  const parsed = jobSearchQuerySchema.safeParse({
    q: first(raw.q),
    offset: first(raw.offset),
    limit: first(raw.limit),
    remote: first(raw.remote),
  });
  const environment = parseWebEnvironment(process.env);

  let content: React.ReactNode;
  if (!parsed.success) {
    content = (
      <section className="error-panel" role="alert">
        <h2>That search could not be understood</h2>
        <p>Check the filters and try again.</p>
      </section>
    );
  } else {
    try {
      const result = await searchJobs(parsed.data);
      content = (
        <>
          <p className="results-summary" aria-live="polite">
            {result.total.toLocaleString('en-SE')} current jobs found
          </p>
          {result.jobs.length ? (
            <JobResults jobs={result.jobs} />
          ) : (
            <section className="empty-panel">
              <h2>No matching jobs</h2>
              <p>Try a broader role, skill, or location.</p>
            </section>
          )}
          <nav className="pagination" aria-label="Search result pages">
            {result.offset > 0 ? (
              <Link
                className="secondary-link"
                href={paginationUrl(
                  parsed.data,
                  Math.max(0, result.offset - result.limit),
                )}
              >
                Previous
              </Link>
            ) : (
              <span />
            )}
            {result.hasMore ? (
              <Link
                className="secondary-link"
                href={paginationUrl(parsed.data, result.offset + result.limit)}
              >
                Next
              </Link>
            ) : null}
          </nav>
        </>
      );
    } catch {
      content = (
        <section className="error-panel" role="alert">
          <h2>Job search is temporarily unavailable</h2>
          <p>Your filters are safe. Please try again in a moment.</p>
        </section>
      );
    }
  }

  return (
    <main>
      <div className="shell">
        <header className="topbar">
          <Link className="brand" href="/">
            CareerOS
          </Link>
          <span>JobTech · current listings</span>
          <Link href="/applications">Applications</Link>
        </header>
        <section className="page-heading">
          <p className="eyebrow">Discover</p>
          <h1>Find work worth pursuing.</h1>
          <p className="lede">
            Search current Arbetsförmedlingen listings by role or skill.
          </p>
        </section>
        <SearchForm
          apiBaseUrl={environment.NEXT_PUBLIC_API_BASE_URL}
          initialQuery={parsed.success ? (parsed.data.q ?? '') : ''}
          initialRemote={parsed.success ? (parsed.data.remote ?? false) : false}
        />
        <AssistantDiscoveryResults>{content}</AssistantDiscoveryResults>
      </div>
    </main>
  );
}
