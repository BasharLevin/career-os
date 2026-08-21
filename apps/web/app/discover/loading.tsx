export default function DiscoveryLoading() {
  return (
    <main>
      <div className="shell" aria-busy="true" aria-live="polite">
        <p className="eyebrow">CareerOS</p>
        <h1>Searching current jobs…</h1>
      </div>
    </main>
  );
}
