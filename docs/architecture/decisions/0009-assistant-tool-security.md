# ADR 0009: Policy-enforced assistant tool registry

- Status: accepted
- Date: 2026-08-21

## Context

Model output and retrieved content are untrusted. Assistant actions must not create an alternate authorization path.

## Decision

Allowlist narrow tools with runtime schemas. Tools call NestJS domain services using the authenticated principal and never repositories or SQL directly. Read tools execute within time/count budgets. Mutating calls create expiring, user-bound confirmation proposals and execute only after an explicit signed confirmation. Consequential operations use idempotency and optimistic concurrency. Audit rows contain hashes, authorization outcomes, timings and bounded outcome labels, not prompts or sensitive arguments.

## Consequences

Prompt injection cannot directly grant capabilities. Confirmation introduces an extra interaction and pending arguments require short retention. Authorization is repeated during execution; cross-owner identifiers remain indistinguishable from missing identifiers.
