# Database Operations

Azure SQL is authoritative and TypeORM synchronization is disabled. Build the
API and run `npm run db:migrate --workspace @career-os/api` before deploying code
that depends on a new schema. Production only migrates forward.

The API imports internal workspaces through their emitted `dist` exports. From a
clean checkout, build it through `npx turbo run build
--filter=@career-os/api...`; the suffix includes the API's workspace
dependencies and Turbo builds them in topological order. Running `npm run build
--workspace @career-os/api` directly is only valid when every internal
dependency has already been built. Database migrations must never run before
the dependency-inclusive build completes.

Local SQL Server runs with `docker compose up -d sql`. Configure the
`DATABASE_*` settings; production rejects unencrypted connections. Credentials
belong in untracked local settings or Azure Key Vault-backed deployment values.

Back up before schema releases and monitor migration blocking. A failed
all-transaction migration rolls back; never repair it through table replacement.
