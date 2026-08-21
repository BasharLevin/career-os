import {
  BadRequestException,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import type { ZodType } from 'zod';

function parse(schema: ZodType, value: unknown): unknown {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new BadRequestException({
      message: 'Invalid request',
      issues: result.error.issues,
    });
  return result.data;
}
export const ValidBody = createParamDecorator(
  (schema: ZodType, context: ExecutionContext) =>
    parse(schema, context.switchToHttp().getRequest<Request>().body),
);
export const ValidQuery = createParamDecorator(
  (schema: ZodType, context: ExecutionContext) =>
    parse(schema, context.switchToHttp().getRequest<Request>().query),
);
