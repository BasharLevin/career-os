import {
  applicationSchema,
  applicationsResponseSchema,
  historyResponseSchema,
  savedJobSchema,
  type Application,
  type ApplicationStatus,
} from '@career-os/contracts';

const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
export class TrackingApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
async function call(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${base}/api/v1${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  if (!response.ok)
    throw new TrackingApiError(
      response.status,
      (await response.text()) || 'Request failed',
    );
  if (response.status === 204) return undefined;
  return response.json();
}
export const trackingApi = {
  save: (externalId: string) =>
    call('/saved-jobs', {
      method: 'POST',
      body: JSON.stringify({ externalId }),
    }).then((value) => savedJobSchema.parse(value)),
  unsave: (externalId: string) =>
    call(`/saved-jobs/${encodeURIComponent(externalId)}`, { method: 'DELETE' }),
  applications: (status?: ApplicationStatus) =>
    call(`/applications${status ? `?status=${status}` : ''}`).then((value) =>
      applicationsResponseSchema.parse(value),
    ),
  application: (id: string) =>
    call(`/applications/${id}`).then((value) => applicationSchema.parse(value)),
  create: (externalId: string) =>
    call('/applications', {
      method: 'POST',
      headers: { 'idempotency-key': crypto.randomUUID() },
      body: JSON.stringify({ externalId, initialStatus: 'saved' }),
    }).then((value) => applicationSchema.parse(value)),
  status: (app: Application, status: ApplicationStatus) =>
    call(`/applications/${app.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, expectedVersion: app.version }),
    }).then((value) => applicationSchema.parse(value)),
  history: (id: string) =>
    call(`/applications/${id}/history`).then((value) =>
      historyResponseSchema.parse(value),
    ),
  note: (id: string, body: string) =>
    call(`/applications/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
};
