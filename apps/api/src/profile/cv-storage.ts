import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { parseApiEnvironment } from '@career-os/config';

export interface StoredCv {
  storageKey: string;
  sha256: string;
}

@Injectable()
export class LocalCvStorage {
  async put(
    userKey: string,
    filename: string,
    bytes: Buffer,
  ): Promise<StoredCv> {
    const root = parseApiEnvironment(process.env).CV_STORAGE_DIRECTORY;
    const directory = join(
      root,
      createHash('sha256').update(userKey).digest('hex'),
    );
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const storageKey = join(
      directory,
      `${randomUUID()}${extname(filename).toLowerCase()}`,
    );
    await writeFile(storageKey, bytes, { mode: 0o600, flag: 'wx' });
    return {
      storageKey,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    };
  }
}
