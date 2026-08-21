# ADR 0005: JobTech anti-corruption layer and short-lived local cache

- Status: accepted
- Date: 2026-08-21

## Context

JobTech payloads are broad, nullable, and may evolve independently from CareerOS. Interactive search also needs protection from latency spikes and repeated identical reads.

## Decision

Create `@career-os/jobtech-client` as the only interactive JobTech adapter. Validate upstream JSON at runtime, map it to stable CareerOS contracts, restrict URLs, bound timeout/retry behavior, and translate adapter failures in NestJS. Coalesce and cache successful identical reads in each API process for a configurable short TTL.

Do not expose raw JobTech objects to the browser and do not add a distributed cache until measurements justify it.

## Consequences

Upstream changes fail explicitly at one boundary and web code remains stable. Local caching is operationally simple but cache hit rates decline across multiple replicas. The later ingestion worker may share mapping concepts, but its event schemas and persistence behavior remain separate.
