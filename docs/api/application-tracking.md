# Application Tracking API

All routes use `/api/v1`, require the authenticated principal, return an
`x-correlation-id`, and never accept an ownership identifier from callers.

| Method            | Route                               | Purpose                                 |
| ----------------- | ----------------------------------- | --------------------------------------- |
| POST/DELETE/GET   | `/saved-jobs[/:externalId]`         | Save, unsave, or list jobs              |
| POST/GET          | `/applications`                     | Idempotently create, or filter and list |
| GET               | `/applications/:id`                 | Retrieve one with notes                 |
| PATCH             | `/applications/:id/status`          | Version-checked status change           |
| POST/PATCH/DELETE | `/applications/:id/notes[/:noteId]` | Manage notes                            |
| GET               | `/applications/:id/history`         | Chronological status history            |
| POST              | `/applications/:id/refresh`         | Refresh the JobTech snapshot            |

Application creation requires `Idempotency-Key`. Status and note edits require
`expectedVersion`. Validation failures are 400, authentication failures 401,
unknown or cross-owner resources 404, and stale versions 409.
