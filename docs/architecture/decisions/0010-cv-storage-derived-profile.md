# ADR 0010: External CV originals with provenance-aware profile derivation

- Status: accepted
- Date: 2026-08-21

## Context

CVs are sensitive binary documents. SQL is appropriate for metadata and review state but not original object storage. Extraction is fallible and must not silently modify confirmed facts.

## Decision

Store originals behind a `CVStorage` boundary: a private filesystem volume locally and private Azure Blob Storage in production. SQL stores the opaque storage key, hash, metadata, extracted text, structured suggestions, extractor version, approval state and provenance. PDF/DOCX media type, size, magic bytes and extractable content are validated. Suggestions remain `review_required` until the owner corrects and approves them.

## Consequences

Blob lifecycle, malware scanning, encryption and deletion must be operated with database retention. Derived values are inspectable and cannot overwrite `user_confirmed` fields without a version-checked approval action.
