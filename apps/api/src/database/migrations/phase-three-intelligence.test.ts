import { describe, expect, it, vi } from 'vitest';
import { PhaseThreeIntelligence1724317200000 } from './1724317200000-phase-three-intelligence.js';

describe('Phase 3 migration', () => {
  it('creates owned profile, CV, match, conversation and operation tables forward-only', async () => {
    const query = vi.fn().mockResolvedValue(undefined);
    await new PhaseThreeIntelligence1724317200000().up({ query } as never);
    const sql = String(query.mock.calls[0]?.[0]);
    for (const table of [
      'career_profiles',
      'cv_documents',
      'job_profile_matches',
      'conversations',
      'conversation_messages',
      'assistant_operations',
    ]) {
      expect(sql).toContain(`CREATE TABLE ${table}`);
    }
    expect(sql).toContain('FOREIGN KEY(user_id) REFERENCES users(id)');
  });
});
