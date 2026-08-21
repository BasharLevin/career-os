import { Global, Module } from '@nestjs/common';
import { parseApiEnvironment } from '@career-os/config';
import { AuthGuard } from './auth.guard.js';
import {
  JwksIdentityVerifier,
  LocalIdentityVerifier,
} from './identity-verifier.js';
import { IDENTITY_VERIFIER } from './principal.js';

@Global()
@Module({
  providers: [
    AuthGuard,
    {
      provide: IDENTITY_VERIFIER,
      useFactory: () => {
        const env = parseApiEnvironment(process.env);
        return env.AUTH_MODE === 'local'
          ? new LocalIdentityVerifier(env.AUTH_ISSUER, env.LOCAL_AUTH_SUBJECT)
          : new JwksIdentityVerifier(
              env.AUTH_JWKS_URL!,
              env.AUTH_ISSUER,
              env.AUTH_AUDIENCE,
              env.AUTH_ALLOWED_ALGORITHMS.split(',').map((x) => x.trim()),
            );
      },
    },
  ],
  exports: [AuthGuard, IDENTITY_VERIFIER],
})
export class AuthModule {}
