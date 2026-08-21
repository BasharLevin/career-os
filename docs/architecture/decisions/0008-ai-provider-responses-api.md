# ADR 0008: Provider-neutral AI boundary using the Responses API

- Status: accepted
- Date: 2026-08-21

## Context

CareerOS needs tool-calling text assistance without coupling domain services to one model SDK or exposing credentials. Conversation retention must remain under CareerOS ownership.

## Decision

Define an `AssistantProvider` interface and implement deterministic fake and server-side OpenAI adapters. The OpenAI adapter uses the Responses API with a runtime-configured model, strict function definitions, bounded output, `store: false`, and no browser credential. CareerOS persists normalized conversation state and sends a bounded context window on every turn.

## Consequences

Ordinary tests are deterministic and providers can change without changing tools. CareerOS owns retention and deletion. Provider-specific response IDs and usage metadata may be retained, but hidden reasoning is neither requested nor stored. The implementation follows the official [Responses API](https://developers.openai.com/api/reference/cli/resources/responses/methods/create), [function calling](https://developers.openai.com/api/docs/guides/function-calling), and [conversation state](https://developers.openai.com/api/docs/guides/conversation-state) guidance.
