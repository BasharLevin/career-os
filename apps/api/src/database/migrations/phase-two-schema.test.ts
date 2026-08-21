import { describe, expect, it, vi } from 'vitest';
import { PhaseTwoSchema1724230800000 } from './1724230800000-phase-two-schema.js';
describe('Phase 2 migration', () => {
  it('creates constrained tables, ownership indexes, and stable external identity', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    await new PhaseTwoSchema1724230800000().up({ query } as never);
    const sql = String(query.mock.calls[0]?.[0]);
    for (const table of [
      'users',
      'persisted_jobs',
      'saved_jobs',
      'applications',
      'application_status_history',
      'application_notes',
      'audit_events',
    ])
      expect(sql).toContain(`CREATE TABLE ${table}`);
    expect(sql).toContain('UQ_jobs_source_external');
    expect(sql).toContain('FOREIGN KEY');
    expect(sql).toContain('SYSUTCDATETIME()');
    expect(sql).not.toContain('DROP TABLE');
  });
});
