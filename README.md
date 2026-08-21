# CareerOS

CareerOS is a production-oriented portfolio system for discovering Swedish job ads, tracking applications, and interacting with career data through text and realtime voice.

## Current implementation

Phase 0 provides the verified monorepo, containers, CI/CD, Bicep, validation, logging, tests, and architecture documentation. Phase 1 adds production-oriented interactive JobTech discovery: typed search/autocomplete/detail integration, runtime upstream validation, retries, cancellation, caching, stable API errors, and an accessible responsive Next.js discovery experience.

```bash
cp .env.example .env
npm ci
npm run verify
```

Use Node.js 22. Local services can be started with `docker compose up --build`; provide non-placeholder secrets in `.env` before starting components that require them. Phase 0 services expose only operational readiness behavior. Job discovery begins in Phase 1.

See [the implementation plan](docs/implementation-plan.md) and [target architecture](docs/architecture/target-architecture.md).
