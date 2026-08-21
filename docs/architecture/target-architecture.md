# Target Architecture

## Phase 3 realization

NestJS now has a provider-neutral authentication boundary and transactional
tracking domain backed by TypeORM and SQL Server. JobTech is fetched and
validated before a short transaction persists snapshot, relationship, history,
and audit changes. Next.js adds saving and URL-filtered board/list tracking.
Phase 3 adds private CV object storage, provenance-aware profiles and matching,
SQL-owned conversations, and a provider-neutral Responses API assistant. Tools
reuse authenticated NestJS services and confirmed writes; realtime voice remains deferred.

## System context

```text
Job seeker
   │ HTTPS / WebRTC
   ▼
Next.js web ───────── WebRTC audio ─────────► OpenAI Realtime
   │ REST / SSE                                  │ tool events
   ▼                                             ▼
NestJS API ◄──────────────── secure tool execution/control
   │       │          │
   │       │          ├──► JobTech JobSearch
   │       ├──────────────► OpenAI Responses API
   │
   ├──► Azure SQL ◄── NestJS ingestion worker ◄── JobTech JobStream
   │                         │
   └──► telemetry            └──► Blob replay archive (optional)
             │
             ▼
       Application Insights / Log Analytics
```

## Deployable units

### Next.js web

The web application owns server-rendered routes, accessible interaction, job discovery views, the application board, text chat, and the browser WebRTC client. A root-layout copilot shell preserves the active conversation, structured JobTech results and selected job across navigation; `/assistant` remains the expanded history workspace. Framer Motion communicates state changes but must respect reduced-motion preferences.

The web client may hold a user session and short-lived Realtime session material. It never receives Azure SQL, JobTech private configuration, or the standard OpenAI API key.

### NestJS API

The API is the trust and policy boundary. It validates HTTP input, authenticates principals, enforces object-level authorization, executes assistant tools, controls Realtime sessions, reads/writes application data, and proxies or coordinates interactive JobSearch operations.

Modules will be vertical capabilities rather than transport-only layers: identity, jobs, applications, conversations, assistant, realtime, and operations. Each module owns its domain behavior, repository interface, DTO schemas, and tests.

### NestJS ingestion worker

The worker is independently deployed and scaled. It bootstraps from a JobStream snapshot, consumes incremental events, validates upstream payloads, maps source data, and performs transactional batches. A durable checkpoint advances only in the same transaction as its corresponding upserts.

The worker owns lease coordination, retry policy, dead-letter/replay metadata, data freshness metrics, and removal handling. It does not expose user-facing application behavior.

## Shared packages

- `@career-os/config`: runtime environment schemas and typed configuration.
- `@career-os/contracts`: wire schemas shared by two or more services.
- `@career-os/observability`: structured logger construction and redaction policy.
- Later packages are added only when real consumers exist: JobTech client/models and database migrations.

Packages must not become a miscellaneous dumping ground or import application-specific modules.

## Data and consistency

Azure SQL is the system of record for the local job catalog, users, tracking state, conversation metadata, audit events, ingestion checkpoints, and outbox records.

- Schema changes are forward migrations.
- Job and taxonomy identity uses source identifiers where available.
- Source events are idempotent by source/version identity.
- User tracking changes and history entries commit atomically.
- Outbound asynchronous work uses a transactional outbox when introduced.
- Read models and search indexes are derived and rebuildable.

Azure Blob Storage is optional for encrypted replay archives; CSV is not an application integration boundary. Azure AI Search is deferred until measured search or semantic-retrieval requirements justify it.

## JobTech integration

JobSearch serves interactive search, autocomplete, and ad lookup. The API applies deadlines, cancellation, bounded retries, caching, and upstream error translation.

The `@career-os/jobtech-client` package is the interactive anti-corruption layer. Raw responses are validated and mapped to stable shared contracts before reaching controllers or the browser. HTTP(S) URL allowlisting and plain-text description rendering prevent raw source markup or unsafe schemes from becoming UI behavior.

JobStream maintains the local catalog through snapshot and incremental events. Runtime schemas accept known fields and safely preserve forward compatibility. Transformations retain field provenance and distinguish JobTech-provided requirements from later AI inference.

## AI and tool orchestration

Text assistance uses an OpenAI model through a provider adapter. Model output cannot directly invoke repositories. It proposes calls to a registry of narrow tools whose input schemas, authorization policy, idempotency behavior, and audit semantics are explicit.

Read tools may execute immediately. Consequential write tools return a confirmation proposal; execution requires a short-lived, user-bound confirmation token. Tool results are treated as data, not instructions.

Job descriptions and notes are untrusted prompt content. Prompts delimit them, tools use server-derived identity, and authorization is repeated at execution time.

## Realtime voice

The primary voice experience uses OpenAI Realtime native speech-to-speech over WebRTC. The browser establishes the media path using short-lived session authorization obtained through the authenticated API; the standard OpenAI API key stays server-side. The API configures the allowed model, voice, instructions, and tools and retains control of privileged tool execution.

Realtime and text clients share tool contracts and authorization. Barge-in, cancellation, session expiry, reconnect, transcript consent, and text fallback are first-class states. Audio is not persisted by default. Operational events contain timing and identifiers, not raw audio.

The official OpenAI documentation describes `gpt-realtime` as supporting realtime audio/text input and output over WebRTC, WebSocket, or SIP, with function calling. See the [model documentation](https://developers.openai.com/api/docs/models/gpt-realtime) and [Realtime API reference](https://platform.openai.com/docs/api-reference/realtime).

## Identity and authorization

Production uses an OpenID Connect provider, currently targeted at Microsoft Entra External ID. The API validates issuer, audience, signature, lifetime, and subject. Domain records use an internal immutable user ID mapped to external identities.

Authorization combines authenticated ownership, explicit roles for operational endpoints, and resource-level checks. Assistant tools never trust a model-supplied user ID.

## Runtime topology

Azure Container Apps hosts separately scaled web, API, and worker revisions. Azure SQL provides persistence. Key Vault stores secrets; managed identities and workload identity are preferred over stored Azure credentials. Azure Container Registry holds immutable images. Application Insights and Log Analytics receive traces, metrics, and redacted structured logs.

## Reliability and observability

Every inbound request receives or creates a correlation ID. Logs include service, deployment version, environment, event name, and correlation identifiers. OpenTelemetry traces cross HTTP, database, JobTech, and OpenAI boundaries.

Health endpoints separate liveness from readiness. Retries are bounded and jittered, circuit breaking is considered for upstream degradation, and worker concurrency respects backpressure. Service-level indicators include request success/latency, ingestion freshness, checkpoint lag, tool success, Realtime setup latency, and cost/usage budgets.

## Environments and delivery

Local development uses Docker Compose. Azure resources are declared in Bicep with environment-specific parameter files. CI verifies formatting, linting, types, tests, builds, container builds, and Bicep syntax. CD later deploys immutable images and uses environment protection for production.
