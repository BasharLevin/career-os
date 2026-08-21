# CareerOS Engineering Standards

These instructions apply to the entire repository.

## Delivery

- Build one verified phase at a time. Do not begin a later phase until the current phase's exit criteria pass.
- Every application and package must provide functionality required by the current or documented next phase. Do not add empty placeholder modules.
- Keep changes small enough to review. Record consequential, hard-to-reverse decisions in `docs/architecture/decisions/`.
- Update tests and documentation in the same change as behavior.

## Architecture

- Keep `apps/web`, `apps/api`, and `apps/worker` independently deployable.
- Put cross-service types and schemas in shared packages only when at least two consumers exist.
- The browser never receives database, JobTech, or standard OpenAI API credentials.
- Route external integrations through explicit adapters. Keep domain logic independent of SDKs and transports.
- Prefer asynchronous, idempotent ingestion. Database writes must use migrations, transactions, checkpoints, and incremental upserts; never replace production tables wholesale.

## TypeScript and boundaries

- Use strict TypeScript. Do not introduce `any`; use `unknown` and narrow it.
- Validate environment variables, HTTP input, queue/event payloads, and third-party responses at runtime.
- Do not treat TypeScript types as runtime validation.
- Use UTC internally and ISO 8601 at service boundaries.
- Use stable external identifiers and preserve source/provenance metadata.

## Security and privacy

- Never commit secrets, `.env` files, credentials, tokens, generated datasets, user audio, or personal data.
- Keep `.env.example` values non-secret and obviously synthetic.
- Enforce authentication and object-level authorization in the API, including AI-triggered tool calls.
- Treat job descriptions, uploaded text, and model output as untrusted input.
- Require explicit confirmation for consequential AI write actions.
- Log metadata and correlation identifiers, not secrets, raw authorization headers, full prompts, audio, or personal application notes.

## Quality

- Run formatting checks, linting, type checking, tests, and builds before declaring a phase complete.
- Unit-test domain behavior and boundary schemas. Add integration tests for persistence and external adapters when those components arrive.
- Prefer deterministic tests. Network-dependent tests must be opt-in and must not be required for the default test suite.
- Use structured logs with service, environment, version, correlation ID, and event name.

## Repository hygiene

- Do not copy from `../azure-job-market-data-pipeline` any secrets, `.env` files, datasets, screenshots, virtual environments, caches, IDE metadata, or Git history.
- Do not modify `../azure-job-market-data-pipeline`.
- Generate database changes only through forward migrations.
- Do not commit build output, coverage output, local volumes, or dependency directories.
