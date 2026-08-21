# ADR 0007: Provider-neutral JWT/JWKS authentication

- Status: accepted
- Date: 2026-08-21

## Context

CareerOS needs production authentication without coupling domain code to one
identity provider, while local development must remain usable and isolated.

## Decision

An authentication guard resolves a `Principal` through an `IdentityVerifier`.
Production verification uses `jose`, a configured HTTPS JWKS URL, exact issuer
and audience, and an allow-list of asymmetric algorithms. The stable ownership
key is `(issuer, subject)` and is mapped to an internal user UUID.

Local mode returns one identity configured at process startup. It accepts no
user identifier from a request and startup fails if local mode is selected in
production. Requests can never select ownership through body or query fields.

## Consequences

Any OpenID Connect provider that issues compatible access tokens can be
connected through configuration. Interactive login/session exchange belongs to
a later identity-provider integration; Phase 2 establishes and enforces the API
trust boundary.
