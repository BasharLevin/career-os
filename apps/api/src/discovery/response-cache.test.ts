import { describe, expect, it, vi } from 'vitest';
import { ResponseCache } from './response-cache.js';

describe('ResponseCache', () => {
  it('coalesces identical in-flight reads', async () => {
    const cache = new ResponseCache(1_000);
    const loader = vi.fn().mockResolvedValue({ value: 1 });

    const [first, second] = await Promise.all([
      cache.getOrLoad('same-key', loader),
      cache.getOrLoad('same-key', loader),
    ]);

    expect(first).toEqual(second);
    expect(loader).toHaveBeenCalledOnce();
  });

  it('does not cache failures', async () => {
    const cache = new ResponseCache(1_000);
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce('ok');

    await expect(cache.getOrLoad('retryable', loader)).rejects.toThrow(
      'failed',
    );
    await expect(cache.getOrLoad('retryable', loader)).resolves.toBe('ok');
  });
});
