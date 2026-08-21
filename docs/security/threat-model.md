# Threat Model

## Scope and assets

This model covers the browser, Next.js server, NestJS API, ingestion worker, Azure SQL, OpenAI APIs, JobTech APIs, build/deployment pipeline, and Azure control plane.

Protected assets include account identity, profiles, application history and notes, conversation text, transient audio, API credentials, Realtime session authorization, database records, ingestion integrity, audit records, and deployment identities.

## Trust boundaries

1. Browser to CareerOS public endpoints.
2. Browser to OpenAI Realtime WebRTC.
3. API/worker to external JobTech and OpenAI APIs.
4. Services to Azure SQL, Key Vault, and telemetry.
5. CI/CD to Azure deployment control plane.
6. Untrusted job/user content entering model context.

## Threats and controls

| Threat                                 | Impact                                   | Required controls                                                                                                                                       |
| -------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stolen session or token                | Account takeover                         | OIDC validation, secure/HTTP-only cookies where applicable, short lifetimes, CSRF protection, rotation, logout/revocation design                        |
| Broken object authorization            | Cross-user data exposure                 | Server-derived user ID, resource ownership checks in every repository path, negative authorization tests                                                |
| Standard OpenAI key exposed to browser | Account compromise and cost abuse        | Key remains server-side; issue only short-lived, scoped Realtime session authorization after authentication and rate checks                             |
| Realtime session theft/replay          | Unauthorized audio/tool use              | Short expiry, user/session binding, single-use semantics where supported, restrictive configuration, rate limits, disconnect on auth expiry             |
| Prompt injection in job descriptions   | Unauthorized tool use or data disclosure | Treat retrieved text as data, narrow allowlisted tools, validate arguments, repeat authorization, confirm writes, never expose secrets to model context |
| Model performs unintended mutation     | Corrupted tracking history               | Confirmation tokens, idempotency keys, transactional execution, audit record, optimistic concurrency                                                    |
| SQL injection                          | Data compromise                          | Parameterized queries/query builder, schema validation, least-privileged identities, no model-generated SQL execution                                   |
| Malicious JobTech payload              | Service compromise or poisoned catalog   | TLS, runtime schema validation, length limits, safe rendering, content hashing, quarantine/dead-letter workflow                                         |
| Stored or reflected XSS                | Session/data theft                       | React escaping, sanitize explicitly allowed rich text, Content Security Policy, safe external links                                                     |
| SSRF through URLs/tools                | Internal resource access                 | Fixed upstream allowlist, URL parsing, block private/link-local destinations, no arbitrary fetch tool                                                   |
| Log/trace leakage                      | Persistent sensitive-data exposure       | Central redaction, field allowlists, no raw headers/audio/prompts/notes, access control and retention                                                   |
| Ingestion replay/out-of-order events   | Incorrect catalog                        | Source event identity, version/timestamp checks, transactional checkpoint, idempotent upsert, reconciliation jobs                                       |
| Worker concurrency race                | Missed or duplicated changes             | Lease/fencing token, database uniqueness, atomic checkpoint, bounded batch transactions                                                                 |
| Dependency or CI compromise            | Supply-chain compromise                  | Lockfile, minimal workflow permissions, dependency review, pinned actions by major initially and commit SHA before production, provenance/SBOM roadmap  |
| Secret committed to Git                | Credential compromise                    | Ignore rules, secret scanning, synthetic examples, immediate rotation and history remediation runbook                                                   |
| Denial of service/cost abuse           | Outage or excessive OpenAI cost          | Per-user/IP rate limits, concurrency caps, quotas, timeouts, usage alerts, circuit breakers                                                             |
| Destructive migration                  | Data loss                                | Reviewed forward migrations, backups, pre-deploy checks, tested restore and expand/contract rollout                                                     |

## Privacy posture

- Voice audio is transient by default and is not written to application storage.
- Transcript persistence is disclosed and tied to conversation retention controls.
- Collect only career data required by visible features.
- Support export and deletion workflows before production.
- Keep production personal data out of local development and automated tests.

## Security verification gates

- Boundary-schema and authorization tests accompany every endpoint/tool.
- Threat model review is required for new data classes, external integrations, or privileged tools.
- Dependency, secret, container, and infrastructure scanning are introduced before production deployment.
- Penetration testing covers object authorization, Realtime session issuance, prompt injection, and tool confirmation.

## Residual risks to resolve

- Final OIDC provider configuration and account-recovery behavior.
- Exact Realtime short-lived authorization flow and available restrictions at implementation time.
- Data retention periods and applicable GDPR controller/processor obligations.
- JobTech API authentication, quotas, and redistribution obligations at deployment time.
