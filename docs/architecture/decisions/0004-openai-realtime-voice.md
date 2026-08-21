# ADR 0004: OpenAI Realtime over WebRTC for primary voice

- Status: accepted
- Date: 2026-08-21

## Context

CareerOS requires a natural, low-latency speech-to-speech assistant whose actions obey the same policies as text chat.

## Decision

Use OpenAI Realtime with `gpt-realtime` over browser WebRTC. The authenticated NestJS API creates/configures short-lived sessions and remains the privileged tool-execution boundary. Keep the standard OpenAI credential server-side. Do not persist audio by default.

## Consequences

Voice can support interruption and native audio without a separate STT/TTS chain. The system must handle session expiry, realtime event validation, cost controls, provider degradation, transcript consent, and text fallback.

Reference: [official OpenAI `gpt-realtime` documentation](https://developers.openai.com/api/docs/models/gpt-realtime).
