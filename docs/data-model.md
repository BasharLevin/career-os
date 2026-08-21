# Data Model

## Phase 2 implementation

`users` owns saved jobs, applications, notes, status history, and audit events.
`persisted_jobs` is unique by `(source, external_id)` and preserves the JobTech
ID, source URL, canonical JSON snapshot, publication/deadline instants, and first
persisted/last refreshed times. It never derives identity from mutable content.

Applications and notes use integer optimistic versions. A status transaction
updates current state and appends history and audit records. SQL Server foreign
keys prevent orphans; unique, filtered ownership indexes enforce idempotency;
all times are UTC `datetime2(3)` values.

## Modeling rules

- Azure SQL is authoritative for transactional state.
- Primary keys are application-generated UUIDs unless a stable source key is the natural identity.
- External identifiers are strings and are namespaced by source.
- All timestamps are UTC `datetime2`; mutable tables carry creation/update metadata.
- Personal records are always scoped by internal `user_id`.
- Source-provided and AI-inferred attributes are never conflated.
- Migrations are forward-only; ingestion uses transactions and incremental upserts.

## Job catalog

### `jobs`

Canonical source ad: `id`, `source`, `source_job_id`, headline, description, employer fields, occupation concept/label, employment attributes, publication/deadline timestamps, URL, source timestamps, content hash, `last_seen_at`, `removed_at`, and raw version metadata. Unique on `(source, source_job_id)`.

### `job_locations`

One or more structured locations per job: municipality, region, country, coordinates, remote classification, and source concept IDs.

### `skills`

Stable skill identity: internal ID, optional JobTech concept ID, normalized label, and taxonomy version. JobTech concept ID is unique when present.

### `job_skills`

Relationship between a job and skill with `requirement_type`, `provenance`, confidence, extractor version, and source timestamps. `provenance` distinguishes `jobtech_structured` from `ai_inferred`.

### `ingestion_events`, `ingestion_runs`, `ingestion_checkpoints`

Record source event identity and outcome, run metrics, and the last committed stream position. A checkpoint and its catalog mutations commit atomically. Event identities enforce idempotency.

## Identity and preferences

### `users` and `external_identities`

`users` stores the internal principal and lifecycle state. `external_identities` maps issuer and subject to that user without using email as identity.

### `candidate_profiles` and `job_preferences`

User-controlled career summary, skills, target roles, location, remote, and employment preferences. Sensitive fields are minimized and assigned retention rules.

## Tracking

### `saved_jobs`

User/job relationship with source context and timestamps. Unique on `(user_id, job_id)`.

### `applications`

Current projection of an application: user, job, stage, source, key dates, optimistic `row_version`, and soft-deletion metadata. An application may reference a snapshot for externally removed ads.

### `application_status_history`

Append-only transition history containing previous/new stage, actor type, actor user, assistant operation ID where applicable, reason, and timestamp.

### `application_notes`

User-owned notes with author and lifecycle metadata. Note content is excluded from general operational logs.

## Assistant and audit

### `conversations` and `messages`

Conversation ownership, channel, model/configuration metadata, and normalized text events. Raw audio is not stored by default. Retention and deletion operate per user.

### `assistant_operations`

Tool proposal/execution audit containing tool name, user, conversation, idempotency key, confirmation state, redacted arguments/result summary, and timestamps.

### `outbox_messages`

Events committed with domain changes for reliable asynchronous publication. Consumers deduplicate by message ID.

## Principal invariants

1. A user can read or mutate only records authorized for their internal `user_id`.
2. An application stage change and its history row commit in one transaction.
3. A confirmed assistant operation executes at most once.
4. An ingestion checkpoint never advances unless every mutation in that batch commits.
5. Source removal marks a job unavailable but never destroys a user's application history.
6. Inferred skills retain model/extractor provenance and confidence.

The first database migration is intentionally scheduled for the persistence phase, when executable repositories and integration tests can accompany it. Phase 0 does not add an unused schema artifact.
