# Assistant and CV operations

`AI_PROVIDER=fake` is the explicitly labelled Demo/Test local mode. Live local
and production use set `AI_PROVIDER=openai`, a current `OPENAI_MODEL`, and
`OPENAI_API_KEY` through server-only configuration; production startup rejects
the fake provider. Never use a `NEXT_PUBLIC_` variable for the key. Provider
errors remain errors—there is no runtime fallback. Rotate the confirmation
secret independently.

Controls include per-turn tool and duration limits, output limits, bounded SQL-owned context, cancellation, strict tool schemas, confirmation expiry, operation idempotency, and redacted logs. Alert on provider error rate, latency, tool denial/failure, confirmation replay, token usage and spend.

Local CV originals use `CV_STORAGE_DIRECTORY` on the private `cv-data` volume. Production uses private Blob Storage with managed identity, encryption, malware scanning, no public access, lifecycle retention, and coordinated deletion. Backups must cover SQL metadata and blobs consistently.

Live OpenAI tests are opt-in and never part of required CI. Cost review records model, input/output usage, tools per turn, cache behavior and per-user quota. Use evaluation fixtures before changing models or prompt/tool versions, following official [OpenAI eval guidance](https://developers.openai.com/api/docs/guides/evals).
