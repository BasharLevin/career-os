'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  applicationStatuses,
  type Application,
  type ApplicationStatus,
} from '@career-os/contracts';
import { trackingApi, TrackingApiError } from './api';

const labels: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  preparing: 'Preparing',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  technical_interview: 'Technical interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  accepted: 'Accepted',
};
function deadlineClass(value: string | null) {
  if (!value) return '';
  const days = (new Date(value).getTime() - Date.now()) / 86400000;
  return days < 0
    ? 'deadline expired'
    : days <= 7
      ? 'deadline approaching'
      : 'deadline';
}
export function ApplicationWorkspace() {
  const params = useSearchParams(),
    router = useRouter();
  const view = params.get('view') === 'list' ? 'list' : 'board';
  const statusParam = params.get('status');
  const filter = applicationStatuses.includes(statusParam as ApplicationStatus)
    ? (statusParam as ApplicationStatus)
    : undefined;
  const [items, setItems] = useState<Application[]>([]);
  const [state, setState] = useState<
    'loading' | 'ready' | 'error' | 'forbidden' | 'conflict'
  >('loading');
  useEffect(() => {
    trackingApi
      .applications(filter)
      .then((r) => {
        setItems(r.items);
        setState('ready');
      })
      .catch((e: unknown) =>
        setState(
          e instanceof TrackingApiError && e.status === 403
            ? 'forbidden'
            : 'error',
        ),
      );
  }, [filter]);
  const setUrl = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/applications?${next}`);
  };
  const change = async (app: Application, status: ApplicationStatus) => {
    try {
      const next = await trackingApi.status(app, status);
      setItems((old) => old.map((x) => (x.id === app.id ? next : x)));
    } catch (e) {
      setState(
        e instanceof TrackingApiError && e.status === 409
          ? 'conflict'
          : 'error',
      );
    }
  };
  return (
    <section aria-busy={state === 'loading'}>
      <div className="workspace-toolbar">
        <div role="group" aria-label="Application view">
          <button
            aria-pressed={view === 'board'}
            onClick={() => setUrl('view', 'board')}
          >
            Board
          </button>
          <button
            aria-pressed={view === 'list'}
            onClick={() => setUrl('view', 'list')}
          >
            List
          </button>
        </div>
        <label>
          Status{' '}
          <select
            value={filter ?? ''}
            onChange={(e) => setUrl('status', e.target.value || undefined)}
          >
            <option value="">All</option>
            {applicationStatuses.map((s) => (
              <option key={s} value={s}>
                {labels[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {state === 'loading' ? (
        <p aria-live="polite">Loading applications…</p>
      ) : null}
      {state === 'forbidden' ? (
        <div role="alert">You do not have access to this workspace.</div>
      ) : null}
      {state === 'conflict' ? (
        <div role="alert">
          This application changed in another session. Reload before trying
          again.
        </div>
      ) : null}
      {state === 'error' ? (
        <div role="alert">Applications are temporarily unavailable.</div>
      ) : null}
      {state === 'ready' && !items.length ? (
        <div className="empty-panel">
          <h2>No applications yet</h2>
          <p>
            Create one from a JobTech listing when you are ready to pursue it.
          </p>
        </div>
      ) : null}
      <div
        className={view === 'board' ? 'application-board' : 'application-list'}
      >
        {items.map((app) => (
          <article className="application-card" key={app.id}>
            <div>
              <span className="status-label">{labels[app.status]}</span>
              <h2>{app.job.snapshot.headline}</h2>
              <p>{app.job.snapshot.employerName ?? 'Employer not specified'}</p>
              {app.job.applicationDeadline ? (
                <p className={deadlineClass(app.job.applicationDeadline)}>
                  Deadline {app.job.applicationDeadline.slice(0, 10)}
                </p>
              ) : null}
            </div>
            <label>
              Move to{' '}
              <select
                aria-label={`Status for ${app.job.snapshot.headline}`}
                value={app.status}
                onChange={(e) =>
                  void change(app, e.target.value as ApplicationStatus)
                }
              >
                {applicationStatuses.map((s) => (
                  <option value={s} key={s}>
                    {labels[s]}
                  </option>
                ))}
              </select>
            </label>
            <a href={`/applications/${app.id}`}>Timeline and notes</a>
          </article>
        ))}
      </div>
    </section>
  );
}
