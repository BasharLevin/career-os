# ADR 0002: Azure SQL as the transactional system of record

- Status: accepted
- Date: 2026-08-21

## Context

Application tracking is relational and transactional. The source project already established practical Azure SQL experience.

## Decision

Use Azure SQL for canonical jobs, identity mappings, tracking history, assistant audit, and ingestion checkpoints. Use migrations and transactional incremental upserts. Derived search indexes remain rebuildable.

## Consequences

This provides strong invariants and a coherent operational surface. Semantic/vector search may require a separate derived service later, based on measurements.
