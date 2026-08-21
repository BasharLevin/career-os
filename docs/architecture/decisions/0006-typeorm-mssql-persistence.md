# ADR 0006: TypeORM with the Microsoft SQL Server driver

- Status: accepted
- Date: 2026-08-21

## Context

CareerOS needs Azure SQL in production, SQL Server locally, explicit migrations,
and transactions spanning snapshots, applications, history, and audit records.

## Decision

Use TypeORM 0.3 with its `mssql` driver. Schema changes are reviewed,
forward-only migrations; `synchronize` is always disabled. Connections use UTC,
encrypted transport in production, bounded pools, and rollback-on-error.
Repositories receive the transaction-scoped `EntityManager` for multi-record
operations. Optimistic concurrency uses an integer version in an atomic
ownership-scoped update rather than in-memory version comparison.

## Consequences

SQL is deliberately SQL Server-specific where constraints or indexes benefit
from it. Migrations must be exercised against SQL Server, not an in-memory SQL
dialect. Rollback methods exist for disposable development/test databases, but
production deployment policy only runs migrations forward.
