import { describe, expect, it, vi } from 'vitest';
import { AssistantService } from './assistant.service.js';

describe('assistant confirmation enforcement', () => {
  it('proposes but does not execute a mutating tool', async () => {
    const provider = {
      mode: 'demo' as const,
      respond: vi.fn().mockResolvedValue({
        responseId: 'r',
        text: '',
        calls: [
          {
            callId: 'c',
            name: 'save_job',
            arguments: '{"externalId":"31375817"}',
          },
        ],
      }),
    };
    const conversations = {
      append: vi.fn().mockResolvedValue({ id: 'm' }),
      context: vi.fn().mockResolvedValue([{ role: 'user', content: 'save' }]),
      recentToolState: vi.fn().mockResolvedValue(null),
      propose: vi
        .fn()
        .mockResolvedValue('11111111-1111-4111-8111-111111111111'),
    };
    const tools = {
      definitions: vi.fn().mockReturnValue([]),
      parse: vi.fn().mockReturnValue({
        name: 'save_job',
        args: { externalId: '31375817' },
      }),
      isMutating: vi.fn().mockReturnValue(true),
      hash: vi.fn().mockReturnValue('hash'),
      execute: vi.fn(),
    };
    const service = new AssistantService(
      provider,
      conversations as never,
      tools as never,
    );
    const events = await service.message(
      { issuer: 'test', subject: 'owner' },
      'conversation',
      'save',
      '11111111-1111-4111-8111-111111111111',
      'correlation',
    );
    expect(events.some((event) => event.type === 'confirmation_required')).toBe(
      true,
    );
    expect(tools.execute).not.toHaveBeenCalled();
  });
  it('propagates a live-provider failure without running fake behavior or tools', async () => {
    const provider = {
      mode: 'openai' as const,
      respond: vi.fn().mockRejectedValue(new Error('provider unavailable')),
    };
    const conversations = {
      append: vi.fn().mockResolvedValue({ id: 'm' }),
      context: vi.fn().mockResolvedValue([{ role: 'user', content: 'hej' }]),
      recentToolState: vi.fn().mockResolvedValue(null),
    };
    const tools = {
      definitions: vi.fn().mockReturnValue([]),
      execute: vi.fn(),
    };
    const service = new AssistantService(
      provider,
      conversations as never,
      tools as never,
    );
    await expect(
      service.message(
        { issuer: 'test', subject: 'owner' },
        'conversation',
        'hej',
        '11111111-1111-4111-8111-111111111119',
        'correlation',
      ),
    ).rejects.toThrow('provider unavailable');
    expect(tools.execute).not.toHaveBeenCalled();
  });
  it('resolves “that one” to the persisted selected result before confirmation', async () => {
    const provider = {
      mode: 'demo' as const,
      respond: vi.fn().mockResolvedValue({
        responseId: 'r',
        text: '',
        calls: [
          {
            callId: 'c',
            name: 'save_job',
            arguments: '{"externalId":"__recent__"}',
          },
        ],
      }),
    };
    const conversations = {
      append: vi.fn().mockResolvedValue({ id: 'm' }),
      context: vi
        .fn()
        .mockResolvedValue([{ role: 'user', content: 'save that one' }]),
      recentToolState: vi.fn().mockResolvedValue({
        selectedJobId: 'job-2',
        jobs: [{ id: 'job-1' }, { id: 'job-2' }],
      }),
      propose: vi
        .fn()
        .mockResolvedValue('11111111-1111-4111-8111-111111111111'),
    };
    const tools = {
      definitions: vi.fn().mockReturnValue([]),
      parse: vi.fn().mockReturnValue({
        name: 'save_job',
        args: { externalId: '__recent__' },
      }),
      isMutating: vi.fn().mockReturnValue(true),
      hash: vi.fn().mockReturnValue('hash'),
      execute: vi.fn(),
    };
    await new AssistantService(
      provider,
      conversations as never,
      tools as never,
    ).message(
      { issuer: 'test', subject: 'owner' },
      'conversation',
      'save that one',
      '11111111-1111-4111-8111-111111111120',
      'correlation',
    );
    expect(conversations.propose).toHaveBeenCalledWith(
      expect.anything(),
      'conversation',
      'save_job',
      { externalId: 'job-2' },
      'hash',
      expect.any(Date),
    );
  });
});
