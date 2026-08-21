# Profile, matching and assistant API

All endpoints are authenticated, owner-scoped, validated at runtime, and return correlation identifiers.

| Method    | Route                                | Purpose                                              |
| --------- | ------------------------------------ | ---------------------------------------------------- |
| GET/PATCH | `/api/v1/profile`                    | Read or version-check confirmed profile preferences  |
| GET/POST  | `/api/v1/profile/cvs`                | List or upload validated PDF/DOCX CVs                |
| POST      | `/api/v1/profile/cvs/:id/approve`    | Approve corrected derived fields                     |
| POST      | `/api/v1/matches/:externalId`        | Recalculate and persist an evidence-based match      |
| GET/POST  | `/api/v1/conversations`              | List or create conversations                         |
| GET       | `/api/v1/conversations/:id`          | Retrieve one owned conversation and messages         |
| POST      | `/api/v1/conversations/:id/messages` | Send a client-idempotent message; receive SSE events |
| POST      | `/api/v1/conversations/:id/confirm`  | Explicitly confirm one pending mutation; receive SSE |

SSE event types are `provider_status`, `text_delta`, `tool_started`, `tool_completed`, `confirmation_required`, `completed`, and `error`. Clients reconnect by retrieving the persisted conversation and may safely retry a user message with the same `clientMessageId`. Closing the stream cancels provider work.

Search completions include validated JobTech summaries, effective structured
criteria, strict-result status, count, selection and source provenance. The
same bounded state is persisted in message metadata for safe multi-turn,
navigation and refresh recovery. Demo mode is explicitly labelled. Production
rejects demo mode, and OpenAI errors never trigger a silent fallback.
