import Link from 'next/link';

export default function JobNotFound() {
  return (
    <main>
      <div className="shell empty-panel">
        <h1>This job is no longer available</h1>
        <p>It may have expired or been removed from JobTech.</p>
        <Link className="secondary-link" href="/discover">
          Return to discovery
        </Link>
      </div>
    </main>
  );
}
