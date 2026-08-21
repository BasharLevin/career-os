'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // A production telemetry adapter will capture this without rendering details to the user.
    console.error('CareerOS route error', { name: error.name });
  }, [error]);
  return (
    <main>
      <section className="shell error-panel" role="alert">
        <h1>Something went wrong</h1>
        <p>The unexpected error has not changed your data.</p>
        <button onClick={reset} type="button">
          Try again
        </button>
      </section>
    </main>
  );
}
