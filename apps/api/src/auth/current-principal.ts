import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { PRINCIPAL, type Principal } from './principal.js';

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Principal => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { [PRINCIPAL]: Principal }>();
    return request[PRINCIPAL];
  },
);
