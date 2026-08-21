import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { sensitiveLogPaths } from './index.js';

describe('structured logging policy', () => {
  it('redacts authorization headers', () => {
    let output = '';
    const destination = new Writable({
      write(
        chunk: Buffer,
        _encoding: BufferEncoding,
        callback: (error?: Error | null) => void,
      ) {
        output += chunk.toString();
        callback();
      },
    });
    const logger = pino(
      { redact: { paths: [...sensitiveLogPaths], censor: '[REDACTED]' } },
      destination,
    );

    logger.info({ req: { headers: { authorization: 'Bearer secret' } } });

    expect(output).not.toContain('Bearer secret');
    expect(output).toContain('[REDACTED]');
  });
});
