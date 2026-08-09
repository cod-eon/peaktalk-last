# 0003 — Auth migration gate

Status: proposed migration placeholder; not approved for implementation
Date: 2026-08-09

## Intended target

Use self-hosted Logto OSS as the target authentication system. Supabase Auth
remains legacy until a controlled migration.

## Gate

This placeholder does not authorize deployment or code changes. Before
implementation, approve a separate decision brief covering identity mapping,
session and token cutover, recovery, authorization regression cases, feature
flag behavior, rollback, operational ownership, and removal criteria.

Sequence after product specs and the harness are verified: prepare the Logto
migration gate, deploy Logto, run Auth migration behind a feature flag, then
remove Supabase dependencies only after smoke and regression checks. This is a
separate release from Storage migration.
