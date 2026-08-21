import {
  BadRequestException,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import type { ZodType } from 'zod';

function parse<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new BadRequestException({
      message: 'Invalid request',
      issues: result.error.issues,
    });
  return result.data;
}
export function parsed<T>(schema: ZodType<T>, value: unknown): T {
  return parse(schema, value);
}
export const ValidBody = createParamDecorator(
  (schema: ZodType, context: ExecutionContext) =>
    parse(schema, context.switchToHttp().getRequest<Request>().body),
);
export const ValidQuery = createParamDecorator(
  (schema: ZodType, context: ExecutionContext) =>
    parse(schema, context.switchToHttp().getRequest<Request>().query),
);
