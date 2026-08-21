# CareerOS

CareerOS is a production-oriented portfolio system for discovering Swedish job ads, tracking applications, and interacting with career data through text and realtime voice.

## Phase 0

The repository currently contains the verified monorepo foundation: Next.js web, NestJS API, a separate NestJS worker, shared runtime-validation and observability packages, Docker development definitions, CI, Bicep foundations, tests, and architecture documentation.

```bash
cp .env.example .env
npm ci
npm run verify
```

Use Node.js 22. Local services can be started with `docker compose up --build`; provide non-placeholder secrets in `.env` before starting components that require them. Phase 0 services expose only operational readiness behavior. Job discovery begins in Phase 1.

See [the implementation plan](docs/implementation-plan.md) and [target architecture](docs/architecture/target-architecture.md).
