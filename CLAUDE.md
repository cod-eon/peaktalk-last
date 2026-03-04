# PeakTalk — Claude Instructions

## Project

**PeakTalk** — B2C SaaS AI-coach for communication skills: IT interview prep, confident speech, filler word elimination, public speaking.

**Core flow:** User records video → AI analyzes → detailed report with metrics, timeline, recommendations → training → progress tracking.

**Target:** Russian-speaking students and junior devs preparing for IT interviews.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion · TanStack Query · Zustand · next-pwa |
| Backend | Python 3.12 · FastAPI · Celery · Redis |
| DB / Storage | PostgreSQL · Supabase Storage → Yandex Cloud S3 |
| AI | Gemini API (transcription, speech analysis, feedback, voice simulations) |
| Infra | DDoS-Guard → Yandex CDN → Nginx → FastAPI · slowapi |
| Deploy | PWA (no App Store) · Web Push notifications |

## Architecture

```
[Next.js 15 PWA]
      ↕ HTTP/REST
[FastAPI — API, auth, CRUD]
      ↕ Redis (task queue + status cache)
[Celery AI-worker]  ←→  Gemini API
      ↕
[PostgreSQL]  [Supabase / Yandex S3]
```

Video analysis is async (up to 5 min): compress to 360p via ffmpeg → delete original → notify via Web Push.

## Key DB Models

```
User · OnboardingProfile · LearningPlan · Exercise
UserExercise · Report · Simulation
```

## Key API Endpoints

```
POST /onboarding              → learning plan
GET  /dashboard               → metrics + next exercise
POST /exercises/{id}/submit   → upload video → Celery task
GET  /reports/{id}            → analysis result
WS   /simulations/{id}        → realtime voice simulation
```

## Autonomy Rules

Claude operates in **maximum autonomy mode**:

- Read/write/edit files — **no confirmation needed**
- Install dependencies (pip, npm, bun) — **no confirmation needed**
- Run tests and linters — **no confirmation needed**
- Create git commits — **no confirmation needed**
- Create/switch branches — **no confirmation needed**
- **`git push` — always confirm with user first**
- **Destructive operations** (drop DB, rm -rf, reset --hard) — **always confirm**
- **Opening PRs** — confirm before creating

## Git Workflow

- `main` — production-ready, never push directly
- Feature branches: `feat/`, `fix/`, `chore/` prefixes
- One feature = one branch = one PR
- Commit messages in **English**, imperative mood (`Add`, `Fix`, `Update`)
- Before starting any feature: create branch from `main`

## Code Conventions

- **Language:** code and comments in English, commits in English
- **Python:** follow PEP 8, use type hints, Pydantic models for all request/response schemas
- **TypeScript:** strict mode, no `any`, prefer functional components
- **API:** RESTful, consistent error responses `{detail: string, code: string}`
- **Tests:** write tests for new backend endpoints (pytest), critical frontend paths (Playwright)
- **No dead code:** remove unused imports, variables, commented-out blocks

## Communication

- Speak with user in **Russian**
- Report progress concisely — lead with what was done, not what you're about to do
- When blocked: explain the blocker clearly, propose alternatives, don't retry blindly
- When creating a branch or making commits: briefly mention it in the response
