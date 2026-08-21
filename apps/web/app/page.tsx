import { FoundationStatus } from '../src/foundation-status';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">CareerOS · Phase 0</p>
        <h1 id="page-title">
          A trustworthy operating system for your job search.
        </h1>
        <p className="lede">
          Discover Swedish roles, understand the fit, and keep an auditable
          application history through text and realtime voice.
        </p>
        <FoundationStatus />
        <Link className="primary-link" href="/discover">
          Explore current jobs
        </Link>
      </section>
    </main>
  );
}
