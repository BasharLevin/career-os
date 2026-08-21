'use client';
import { useEffect, useState, type FormEvent } from 'react';
import type { Application } from '@career-os/contracts';
import { trackingApi } from './api';
export function ApplicationDetail({ id }: { id: string }) {
  const [app, setApp] = useState<Application>();
  const [history, setHistory] = useState<
    Awaited<ReturnType<typeof trackingApi.history>>['items']
  >([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    Promise.all([trackingApi.application(id), trackingApi.history(id)])
      .then(([a, h]) => {
        setApp(a);
        setHistory(h.items);
      })
      .catch(() => setError(true));
  }, [id]);
  if (error)
    return (
      <div role="alert">
        This application could not be loaded or is not yours.
      </div>
    );
  if (!app) return <p aria-live="polite">Loading application…</p>;
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const value = data.get('note');
    if (typeof value !== 'string') return;
    await trackingApi.note(id, value);
    setApp(await trackingApi.application(id));
    form.reset();
  };
  return (
    <div className="detail-grid">
      <article>
        <h1>{app.job.snapshot.headline}</h1>
        <p>{app.job.snapshot.employerName}</p>
        <h2>Status timeline</h2>
        <ol className="timeline">
          {history.map((item) => (
            <li key={item.id}>
              <strong>{item.toStatus.replaceAll('_', ' ')}</strong>
              <time dateTime={item.changedAt}>
                {new Date(item.changedAt).toLocaleString('en-SE')}
              </time>
            </li>
          ))}
        </ol>
      </article>
      <aside className="detail-sidebar">
        <h2>Notes</h2>
        {app.notes?.length ? (
          <ul className="notes">
            {app.notes.map((n) => (
              <li key={n.id}>{n.body}</li>
            ))}
          </ul>
        ) : (
          <p>No notes yet.</p>
        )}
        <form onSubmit={(e) => void submit(e)}>
          <label htmlFor="note">Add a note</label>
          <textarea id="note" name="note" maxLength={10000} required />
          <button type="submit">Add note</button>
        </form>
      </aside>
    </div>
  );
}
