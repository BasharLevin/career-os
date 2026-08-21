import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  IDENTITY_VERIFIER,
  PRINCIPAL,
  type IdentityVerifier,
} from './principal.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(IDENTITY_VERIFIER) private readonly verifier: IdentityVerifier,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { [PRINCIPAL]?: unknown }>();
    request[PRINCIPAL] = await this.verifier.verify(
      request.header('authorization'),
    );
    return true;
  }
}
