import { describe, expect, it, vi } from 'vitest';
import {
  normalizeCorrelationId,
  registerResponseCompletion,
  type CompletionLogger,
  type CompletionResponse,
} from './request-logging.middleware.js';

describe('correlation IDs', () => {
  it('preserves a safe caller-provided identifier', () => {
    expect(normalizeCorrelationId('request-123')).toBe('request-123');
  });

  it('uses the first safe identifier from a string array', () => {
    expect(normalizeCorrelationId(['request-456', 'request-ignored'])).toBe(
      'request-456',
    );
  });

  it('generates an identifier when the header is missing', () => {
    expect(normalizeCorrelationId(undefined)).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('replaces values that could poison structured logs', () => {
    const normalized = normalizeCorrelationId('bad\n{"forged":true}');
    expect(normalized).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('request completion logging', () => {
  it('sets the correlation header and logs status and duration on finish', () => {
    let finishListener: (() => void) | undefined;
    const setHeader = vi.fn<(name: string, value: string) => void>();
    const response: CompletionResponse = {
      statusCode: 201,
      setHeader,
      once: (event, listener) => {
        expect(event).toBe('finish');
        finishListener = listener;
      },
    };
    const info = vi.fn<CompletionLogger['info']>();

    registerResponseCompletion(
      { method: 'POST', path: '/api/v1/applications' },
      response,
      { info },
      'request-789',
      100.2,
      () => 142.6,
    );

    expect(setHeader).toHaveBeenCalledWith('x-correlation-id', 'request-789');
    expect(info).not.toHaveBeenCalled();
    expect(finishListener).toBeDefined();
    finishListener?.();
    expect(info).toHaveBeenCalledWith({
      correlationId: 'request-789',
      durationMs: 42,
      event: 'http.request.completed',
      method: 'POST',
      path: '/api/v1/applications',
      statusCode: 201,
    });
  });
});
