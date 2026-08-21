# ADR 0003: Hybrid JobSearch and JobStream integration

- Status: accepted
- Date: 2026-08-21

## Context

Interactive discovery and complete catalog synchronization have different access patterns.

## Decision

Use JobSearch for interactive query, autocomplete, and ad lookup. Use JobStream snapshot plus incremental events in a separate worker for the durable catalog.

## Consequences

The API can optimize user latency while the worker owns synchronization complexity. Mapping schemas and identifiers must remain consistent across both integrations.
