# Production Identity Provider Integration

Configure an OIDC provider to issue asymmetric access tokens for the CareerOS
API audience. Set `AUTH_MODE=jwks`, exact issuer and audience, an HTTPS JWKS URL,
and a narrow algorithm allow-list. The API validates signature and registered
claims before creating a principal.

The later web login/session adapter may use Entra ID, Auth0, or another OIDC
provider without changing domain ownership. It must pass an access token and
must never translate a browser-supplied user ID into a principal.

Local mode maps every request to one configured subject. Requests cannot select
that subject, and production startup rejects local mode.
