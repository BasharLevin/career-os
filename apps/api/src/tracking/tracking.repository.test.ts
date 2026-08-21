import { describe, expect, it, vi } from 'vitest';
import { TrackingRepository } from './tracking.repository.js';
const principal = { issuer: 'test', subject: 'owner-a' };
const job = {
  id: 'job-1',
  headline: 'Engineer',
  employerName: null,
  location: { municipality: null, region: null, country: 'Sweden', city: null },
  occupation: null,
  employmentType: null,
  publicationDate: null,
  applicationDeadline: null,
  webpageUrl: 'https://example.com/jobs/1',
  remote: null,
  descriptionExcerpt: null,
  description: null,
  numberOfVacancies: null,
  salaryDescription: null,
  workingHoursType: null,
  applicationUrl: null,
  mustHaveSkills: [],
  niceToHaveSkills: [],
};
describe('tracking transactions', () => {
  it('uses one transaction and returns an existing application for an idempotency replay', async () => {
    const query = vi.fn().mockImplementation((sql: string) => {
      if (sql.startsWith('SELECT id FROM users')) return [{ id: 'user-1' }];
      if (sql.includes('idempotency_key')) return [{ id: 'application-1' }];
      if (sql.startsWith('SELECT a.id'))
        return [
          {
            id: 'application-1',
            status: 'saved',
            version: 1,
            created_at: new Date(),
            updated_at: new Date(),
            job_id: 'job-db',
            source: 'jobtech',
            external_id: 'job-1',
            source_url: 'https://example.com/jobs/1',
            snapshot_json: JSON.stringify(job),
            publication_date: null,
            application_deadline: null,
            first_persisted_at: new Date(),
            last_refreshed_at: new Date(),
          },
        ];
      if (sql.startsWith('SELECT id,body')) return [];
      return [];
    });
    const transaction = vi.fn((fn: (m: { query: typeof query }) => unknown) =>
      Promise.resolve(fn({ query })),
    );
    const repository = new TrackingRepository({ transaction } as never);
    const result = await repository.createApplication(
      principal,
      job,
      'saved',
      'repeat-key',
      'correlation',
    );
    expect(result.id).toBe('application-1');
    expect(transaction).toHaveBeenCalledOnce();
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).startsWith('INSERT applications'),
      ),
    ).toBe(false);
  });
  it('propagates a failed transactional write so the driver can roll it back', async () => {
    const transaction = vi.fn().mockRejectedValue(new Error('write failed'));
    const repository = new TrackingRepository({ transaction } as never);
    await expect(
      repository.saveJob(principal, job, 'correlation'),
    ).rejects.toThrow('write failed');
  });
  it('deletes an owned note using the deleted row returned by SQL Server', async () => {
    const query = vi.fn().mockImplementation((sql: string) => {
      if (sql.startsWith('SELECT id FROM users')) return [{ id: 'user-1' }];
      if (sql.startsWith('SELECT 1 found FROM applications'))
        return [{ found: 1 }];
      if (sql.startsWith('DELETE application_notes')) return [{ id: 'note-1' }];
      return [];
    });
    const transaction = vi.fn((fn: (m: { query: typeof query }) => unknown) =>
      Promise.resolve(fn({ query })),
    );
    const repository = new TrackingRepository({ transaction } as never);

    await expect(
      repository.deleteNote(
        principal,
        'application-1',
        'note-1',
        'correlation',
      ),
    ).resolves.toBeUndefined();
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).startsWith('DELETE application_notes OUTPUT DELETED.id'),
      ),
    ).toBe(true);
  });

  it('rejects note deletion when SQL Server returns no deleted row', async () => {
    const query = vi.fn().mockImplementation((sql: string) => {
      if (sql.startsWith('SELECT id FROM users')) return [{ id: 'user-1' }];
      if (sql.startsWith('SELECT 1 found FROM applications'))
        return [{ found: 1 }];
      return [];
    });
    const transaction = vi.fn((fn: (m: { query: typeof query }) => unknown) =>
      Promise.resolve(fn({ query })),
    );
    const repository = new TrackingRepository({ transaction } as never);

    await expect(
      repository.deleteNote(
        principal,
        'application-1',
        'missing-note',
        'correlation',
      ),
    ).rejects.toThrow('Note not found');
  });
});
