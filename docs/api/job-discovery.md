# Job Discovery API

Phase 1 exposes a stable CareerOS contract over the JobTech JobSearch API. Consumers must not depend on raw JobTech payloads.

## `GET /v1/jobs`

Supported query parameters:

| Parameter         | Type              | Constraints                             | Upstream mapping   |
| ----------------- | ----------------- | --------------------------------------- | ------------------ |
| `q`               | string            | 1–200 trimmed characters                | `q`                |
| `offset`          | integer           | 0–1900; default 0                       | `offset`           |
| `limit`           | integer           | 1–100; default 20                       | `limit`            |
| `remote`          | boolean           | `true` or `false`                       | `remote`           |
| `municipality`    | string            | JobTech concept or supported identifier | `municipality`     |
| `region`          | string            | JobTech concept or supported identifier | `region`           |
| `occupationField` | string            | JobTech concept or supported identifier | `occupation-field` |
| `publishedAfter`  | ISO 8601 datetime | Offset required                         | `published-after`  |

The response contains normalized job summaries, total count, offset, limit, and `hasMore`. CareerOS intentionally does not expose JobTech relevance internals or raw HTML descriptions.

## `GET /v1/jobs/autocomplete?q=...`

Requires 2–100 trimmed characters. Returns up to the suggestions supplied by JobTech, normalized to `value`, `type`, and `occurrences`.

## `GET /v1/jobs/{id}`

Returns a normalized job detail. IDs accept only letters, numbers, underscores, and hyphens. URLs are restricted to HTTP(S); descriptions are rendered as text.

## Error behavior

| HTTP status | Meaning                                                   |
| ----------- | --------------------------------------------------------- |
| 400         | CareerOS rejected query/path input                        |
| 404         | JobTech has no current ad for the ID                      |
| 429         | Upstream rate limit remained after bounded retry          |
| 504         | Upstream timeout remained after bounded retry             |
| 503         | JobTech was unavailable or violated its response contract |

Responses do not expose upstream bodies or internal exceptions. Client disconnects cancel in-flight upstream work.

Each API response includes `x-correlation-id`. A safe caller value is propagated; missing or malformed values are replaced. Completion logs contain the method, route path, status, duration, service version, and correlation ID without recording the search query.

## Resilience and caching

- Requests time out after `JOBTECH_REQUEST_TIMEOUT_MS` per attempt.
- Retry count is bounded by `JOBTECH_MAX_RETRIES`.
- Only network failures, timeouts, HTTP 429, and HTTP 5xx are retried.
- Backoff is exponential and bounded by the small retry count.
- Identical reads are coalesced and cached in-process for `JOBTECH_CACHE_TTL_SECONDS`.
- Failed requests are removed from the cache.

The cache is deliberately local and short-lived. A distributed cache is not justified for the current topology and can be added after measuring multi-replica hit rates.
