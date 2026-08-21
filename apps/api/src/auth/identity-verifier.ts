import { UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyOptions } from 'jose';
import type { IdentityVerifier, Principal } from './principal.js';

export class LocalIdentityVerifier implements IdentityVerifier {
  constructor(
    private readonly issuer: string,
    private readonly subject: string,
  ) {}
  verify(): Promise<Principal> {
    return Promise.resolve({ issuer: this.issuer, subject: this.subject });
  }
}

export class JwksIdentityVerifier implements IdentityVerifier {
  private readonly jwks;
  private readonly options: JWTVerifyOptions;
  constructor(
    url: string,
    issuer: string,
    audience: string,
    algorithms: string[],
  ) {
    this.jwks = createRemoteJWKSet(new URL(url));
    this.options = { issuer, audience, algorithms };
  }
  async verify(authorization: string | undefined): Promise<Principal> {
    const match = /^Bearer (.+)$/i.exec(authorization ?? '');
    if (!match?.[1]) throw new UnauthorizedException('Bearer token required');
    try {
      const { payload } = await jwtVerify(match[1], this.jwks, this.options);
      if (!payload.sub || !payload.iss) throw new Error('missing claims');
      return {
        issuer: payload.iss,
        subject: payload.sub,
        ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
        ...(typeof payload.name === 'string'
          ? { displayName: payload.name }
          : {}),
      };
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
