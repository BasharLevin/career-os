import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  expiresAt: number;
  value: Promise<T>;
}

@Injectable()
export class ResponseCache {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly ttlMilliseconds: number) {}

  async getOrLoad<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const existing = this.entries.get(key) as CacheEntry<T> | undefined;
    if (existing && existing.expiresAt > Date.now()) return existing.value;

    const value = loader();
    this.entries.set(key, {
      expiresAt: Date.now() + this.ttlMilliseconds,
      value,
    });
    try {
      return await value;
    } catch (error) {
      if (this.entries.get(key)?.value === value) this.entries.delete(key);
      throw error;
    }
  }
}
