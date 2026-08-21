# ADR 0011: Versioned evidence-first job/profile matching

- Status: accepted
- Date: 2026-08-21

## Context

Opaque match scores encourage fabricated certainty and make recalculation impossible to audit.

## Decision

Calculate a structured assessment from a specific confirmed profile version and persisted JobTech snapshot timestamp. Store matching, missing and uncertain requirements with separate profile/job evidence and provenance, compatibility dimensions, recommendation, logic version, model and configuration metadata. The first implementation is deterministic; future AI enrichment may add inference but never rewrite source facts.

## Consequences

Scores are reproducible and stale assessments can be detected. Lack of evidence becomes uncertainty rather than an invented match. Quality is evaluated with fixtures and version-specific thresholds.
