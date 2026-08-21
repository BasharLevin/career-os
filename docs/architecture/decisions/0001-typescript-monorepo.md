# ADR 0001: TypeScript monorepo with independently deployable applications

- Status: accepted
- Date: 2026-08-21

## Context

CareerOS needs a web application, API, ingestion worker, and genuinely shared boundary code while preserving independent deployment and scaling.

## Decision

Use npm workspaces and Turborepo. Place deployables in `apps/` and code with two or more real consumers in `packages/`. Use strict TypeScript throughout.

## Consequences

One lockfile and verification graph reduce contract drift. Application boundaries must still be respected; shared packages cannot import deployable applications.
