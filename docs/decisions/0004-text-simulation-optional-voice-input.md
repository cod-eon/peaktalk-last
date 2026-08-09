# 0004 — Text simulation with optional voice input

Status: accepted
Date: 2026-08-09

## Decision

PeakTalk MVP does not include voice simulation. The core interaction is a
text-based adversarial simulation that tests the user's position against likely
leadership objections and produces a Defense Brief.

Voice input remains an optional input method for composing a user's text answer.
It is not a separate simulation channel and does not imply speech-quality
scoring, diction coaching, pronunciation feedback, or a voice-specific report.

## Why

- The current product already models simulation as `user` / `assistant` text
  messages and generates a report plus Defense Brief artifact.
- Optional voice input can reduce typing friction without changing the core
  product promise or adding a second simulation system.
- Keeping voice input as an affordance limits MVP scope and makes browser
  permissions, unsupported-browser fallback, and transcription errors explicit
  launch concerns.

## Non-goals

- Voice-to-voice roleplay.
- Speech quality, diction, pronunciation, or confidence scoring.
- Making microphone permission a prerequisite for completing a preparation.

## Acceptance criteria

- A user can complete the full simulation with typed answers only.
- Voice input, where supported, inserts or submits text without changing the
  simulation contract.
- Permission denial, unsupported browsers, and transcription failure have a
  usable text-input fallback.
- Product copy never promises voice simulation or speech coaching.
