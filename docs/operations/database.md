# Database Operations

Azure SQL is authoritative and TypeORM synchronization is disabled. Build the
API and run `npm run db:migrate --workspace @career-os/api` before deploying code
that depends on a new schema. Production only migrates forward.

Local SQL Server runs with `docker compose up -d sql`. Configure the
`DATABASE_*` settings; production rejects unencrypted connections. Credentials
belong in untracked local settings or Azure Key Vault-backed deployment values.

Back up before schema releases and monitor migration blocking. A failed
all-transaction migration rolls back; never repair it through table replacement.
