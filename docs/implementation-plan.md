# Implementation Plan

Phase 3 implements profile intelligence, CV processing, evidence-based matching,
and the confirmed tool-calling text assistant. Realtime voice remains out of scope.

Each phase is independently verified. Later scope remains part of the target architecture but no empty modules are created in anticipation of it.

## Phase 0 — Engineering foundation (current)

Deliver:

- product, architecture, data, threat-model, implementation, and ADR documentation;
- npm workspace with Next.js web, NestJS API, NestJS worker, and shared packages;
- strict TypeScript, ESLint, Prettier, Vitest, Turborepo, and a single verification command;
- runtime environment validation in each deployable service;
- structured redacted logging and operational health behavior;
- multi-stage Dockerfiles and Docker Compose local topology;
- GitHub Actions verification and container-build workflows;
- initial deployable Bicep for monitoring, registry, Container Apps environment, Key Vault, Storage, and Azure SQL;
- tests for environment boundaries, health contracts, and logger redaction configuration.

Exit gate: clean dependency install; format, lint, types, tests, and all three production builds pass. Docker/Bicep validation is reported separately when local tooling is unavailable.

## Phase 1 — JobTech interactive discovery (implemented)

Deliver typed JobSearch client, `/search`, `/complete`, and `/ad/{id}` adapters; validation fixtures; resilience policy; API endpoints; accessible Next.js discovery and detail experiences; Framer Motion transitions; caching and integration telemetry.

Verification: mapper unit tests, adapter contract tests, mocked upstream failure tests, API integration tests, frontend component/e2e tests, accessibility checks, and production builds.

Implemented scope includes the typed adapter, bounded retries/timeouts, cancellation, local request coalescing/cache, stable HTTP errors, search/autocomplete/detail endpoints, server-rendered discovery, pagination, job details, responsive/reduced-motion presentation, and deterministic unit/HTTP/component tests. Browser-level E2E and automated accessibility scanning remain part of the final verification gate and require the browser test harness planned alongside authenticated flows.

## Phase 2 — Identity, Azure SQL, and tracking

Deliver OIDC integration, internal identity mapping, migrations, job persistence, saved jobs, applications, state transition history, notes, authorization, transactional repositories, local SQL integration tests, and board/timeline UI.

Verification: migration up/down strategy tests where safe, SQL integration tests, cross-user denial tests, transition invariants, optimistic-concurrency tests, and e2e tracking flow.

## Phase 3 — Profile intelligence and AI text orchestration (implemented)

Deliver versioned profiles, externally stored CV originals, extraction review,
evidence/provenance matching, provider-neutral Responses API integration,
strict read tools, confirmed/idempotent write tools, SQL-owned conversations,
SSE streaming, cancellation, history and deterministic evaluation fixtures.

## Phase 4 — JobStream catalog ingestion

Deliver snapshot bootstrap, incremental stream consumer, runtime schemas, mapping/provenance, transactional upsert/checkpoint, removal behavior, leases, retries, reconciliation, metrics, and operational runbooks.

Verification: replay, duplicate, ordering, crash-before/after-checkpoint, malformed payload, lease contention, and realistic batch performance tests.

## Phase 5 — Expanded AI orchestration

Deliver model adapter, prompt/version registry, typed tool registry, read tools, confirmed write tools, idempotency, conversation persistence, prompt-injection controls, audit records, budgets, and evaluation harness.

Verification: deterministic tool tests, authorization/adversarial tests, confirmation expiry/replay tests, recorded provider-contract tests, and quality evaluations.

## Phase 6 — OpenAI Realtime voice

Deliver authenticated Realtime session creation, browser WebRTC state machine, speech-to-speech UI, barge-in/cancellation, voice tool events, transcript consent, reconnect/fallback behavior, session metrics, quotas, and abuse controls.

Verification: mocked protocol tests, browser permission/device tests, interruption and expiry tests, tool authorization parity, accessibility, latency/error telemetry, and opt-in live smoke tests.

## Phase 7 — Recommendations and derived intelligence

Deliver preference matching, explainable ranking, inferred skills with provenance, feedback signals, offline evaluation, and optionally Azure AI Search based on measured need.

Verification: ranking fixtures, bias/error review, provenance tests, quality thresholds, indexing recovery, and cost/load tests.

## Phase 8 — Production operations and delivery

Deliver complete environment modules, private networking decisions, managed identities, Key Vault wiring, image provenance, staged CD, migrations as deployment jobs, dashboards/alerts, backup/restore, incident and data-subject runbooks, load/security testing, and release procedures.

Verification: ephemeral environment deployment, rollback/roll-forward drill, restore drill, secret rotation, failover/degradation exercises, SLO alerts, and production readiness review.
