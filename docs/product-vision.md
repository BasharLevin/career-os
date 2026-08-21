# CareerOS Product Vision

## Purpose

CareerOS helps people discover relevant Swedish jobs, understand why a role fits, and maintain an accurate history of every application through text and natural voice interaction.

The project is intentionally production-oriented. Its purpose is to demonstrate product judgment, distributed-system design, cloud operations, secure AI orchestration, data engineering, and a polished user experience—not merely to assemble a feature demo.

## Users and outcomes

The primary user is a job seeker managing an active search. CareerOS should let that person:

- discover current roles through conversational and structured search;
- understand requirements, location, deadlines, and source provenance;
- save jobs and move applications through an explicit workflow;
- retain notes and an immutable status history;
- ask questions about their own pipeline without exposing another user's data;
- use typed chat or low-latency speech-to-speech interaction;
- see and confirm consequential actions before the assistant performs them.

## Product principles

1. **Trust over spectacle.** Recommendations are explainable, sourced, and distinguish JobTech facts from AI inference.
2. **Voice and text are equal clients.** Both use the same authorization and tool contracts.
3. **The assistant acts through tools.** Models never receive database credentials or unrestricted persistence access.
4. **History is durable.** User actions and source changes are append-only where auditability matters.
5. **Privacy is the default.** Audio is transient by default, logs exclude sensitive content, and retention is explicit.
6. **Operational behavior is product behavior.** Backpressure, retries, observability, recovery, and cost controls are designed features.

## In scope

- Swedish job discovery using JobTech JobSearch and JobStream.
- Authenticated personal profiles and authorization boundaries.
- Saved jobs, application stages, notes, and status history.
- AI search, explanation, comparison, and confirmed tracking actions.
- OpenAI Realtime speech-to-speech in the browser.
- Incrementally maintained Azure SQL job catalog.
- Containerized services, infrastructure as code, CI/CD, monitoring, and operating documentation.

## Explicit non-goals

- Automatically applying to jobs or impersonating a user.
- Scraping sources outside approved API terms.
- Treating model-generated facts as source truth.
- Persisting raw voice recordings by default.
- Premature multi-region or microservice decomposition without measured need.

## Success measures

- Search and tracking operations are correct, authorized, and auditable.
- Job ingestion recovers from interruption without duplicates or full-table replacement.
- Every assistant mutation maps to a validated tool call and confirmation record.
- Voice sessions establish without exposing the standard OpenAI API key.
- Logs correlate a user request across web, API, worker, upstream calls, and persistence.
- A clean checkout passes one deterministic verification command.
