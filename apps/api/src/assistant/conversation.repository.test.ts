import { describe, expect, it, vi } from 'vitest';
import { ConversationRepository } from './conversation.repository.js';

describe('conversation ownership and replay', () => {
  it('scopes conversation retrieval to the authenticated internal user', async () => {
    const query = vi
      .fn()
      .mockImplementation((sql: string) =>
        sql.startsWith('SELECT id FROM users') ? [{ id: 'user-b' }] : [],
      );
    const transaction = vi.fn(
      (callback: (manager: { query: typeof query }) => unknown) =>
        Promise.resolve(callback({ query })),
    );
    const repository = new ConversationRepository({ transaction } as never);
    await expect(
      repository.get(
        { issuer: 'test', subject: 'owner-b' },
        'owner-a-conversation',
      ),
    ).rejects.toThrow('Conversation not found');
    expect(query).toHaveBeenCalledWith(
      'SELECT * FROM conversations WHERE id=@0 AND user_id=@1',
      ['owner-a-conversation', 'user-b'],
    );
  });

  it('returns the original user message for a client-message replay', async () => {
    const created = new Date('2026-08-21T10:00:00Z');
    const query = vi.fn().mockImplementation((sql: string) => {
      if (sql.startsWith('SELECT id FROM users')) return [{ id: 'user-a' }];
      if (sql.startsWith('SELECT 1 found FROM conversations'))
        return [{ found: 1 }];
      if (sql.startsWith('SELECT * FROM conversation_messages'))
        return [
          {
            id: 'message-1',
            sequence: 1,
            role: 'user',
            kind: 'text',
            content: 'hello',
            metadata_json: null,
            created_at: created,
          },
        ];
      return [];
    });
    const transaction = vi.fn(
      (callback: (manager: { query: typeof query }) => unknown) =>
        Promise.resolve(callback({ query })),
    );
    const result = await new ConversationRepository({
      transaction,
    } as never).append(
      { issuer: 'test', subject: 'owner-a' },
      'conversation-1',
      'user',
      'text',
      'hello',
      '11111111-1111-4111-8111-111111111111',
    );
    expect(result).toMatchObject({ id: 'message-1', replayed: true });
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).startsWith('DECLARE @sequence'),
      ),
    ).toBe(false);
  });
});
