import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const message =
      typeof raw === 'string'
        ? raw
        : typeof raw === 'object' && raw && 'message' in raw
          ? String(raw.message)
          : 'Unexpected server error';
    response.status(status).json({
      error: { code: this.code(status), message },
      correlationId: String(response.locals.correlationId ?? 'unknown'),
    });
  }
  private code(status: number): string {
    if (status === 400) return 'invalid_request';
    if (status === 401) return 'unauthenticated';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'not_found';
    if (status === 409) return 'conflict';
    return 'internal_error';
  }
}
