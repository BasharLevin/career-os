import Link from 'next/link';
import { ApplicationDetail } from '../../../src/tracking/application-detail';
export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main>
      <div className="shell">
        <header className="topbar">
          <Link className="brand" href="/">
            CareerOS
          </Link>
          <Link href="/applications">Back to applications</Link>
        </header>
        <ApplicationDetail id={id} />
      </div>
    </main>
  );
}
