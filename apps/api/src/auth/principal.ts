export interface Principal {
  issuer: string;
  subject: string;
  email?: string;
  displayName?: string;
}

export const PRINCIPAL = Symbol('principal');
export const IDENTITY_VERIFIER = Symbol('IDENTITY_VERIFIER');

export interface IdentityVerifier {
  verify(authorization: string | undefined): Promise<Principal>;
}
