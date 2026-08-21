import Link from 'next/link';
import { Suspense } from 'react';
import { ApplicationWorkspace } from '../../src/tracking/application-workspace';
export default function ApplicationsPage() {
  return (
    <main>
      <div className="shell">
        <header className="topbar">
          <Link className="brand" href="/">
            CareerOS
          </Link>
          <Link href="/discover">Discover jobs</Link>
        </header>
        <section className="page-heading">
          <p className="eyebrow">Applications</p>
          <h1>Keep every next step clear.</h1>
          <p className="lede">
            A durable record of the roles you are pursuing.
          </p>
        </section>
        <Suspense fallback={<p>Loading applications…</p>}>
          <ApplicationWorkspace />
        </Suspense>
      </div>
    </main>
  );
}
