import { describe, expect, it, vi } from 'vitest';
import { AssistantService } from './assistant.service.js';

describe('assistant confirmation enforcement', () => {
  it('proposes but does not execute a mutating tool', async () => {
    const provider = {
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
});
