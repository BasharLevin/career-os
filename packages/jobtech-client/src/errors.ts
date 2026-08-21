export type JobTechErrorCode =
  'invalid_response' | 'not_found' | 'rate_limited' | 'timeout' | 'unavailable';

export class JobTechError extends Error {
  constructor(
    public readonly code: JobTechErrorCode,
    message: string,
    public readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'JobTechError';
  }
}
