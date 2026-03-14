# PeakTalk — Claude Instructions

## Project

**PeakTalk** — B2C SaaS AI-тренер для подготовки к публичным выступлениям (собеседования, доклады, презентации, питчи).

**Core flow:** Пользователь загружает документ → Ленивый парсинг (Lazy Parsing) перед симуляцией → Настройка параметров (тип собеседника, индустрия) → AI-симуляция Q&A сессии с использованием внутреннего монолога (Internal Reasoning) → Хранение всей истории и мыслей тренера в PostgreSQL для аналитики.

**Target:** Студенты, молодые специалисты и фаундеры, готовящиеся к важным коммуникациям.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion · TanStack Query · Zustand · next-pwa |
| Backend | Python 3.12 · FastAPI · Celery · Redis |
| DB / Storage | PostgreSQL · SQLAlchemy 2.0 · Supabase Storage |
| AI | Gemini API (gemini-1.5-flash, анализ контента, внутренний монолог тренера, текстовые симуляции) |
| Infra | DDoS-Guard → Yandex CDN → Nginx → FastAPI · 152-ФЗ |

## Architecture

```
[Next.js 15 PWA]
      ↕ HTTP/REST
[FastAPI — API, auth, CRUD]
      ↕ Redis (task queue)
[Celery AI-worker]  ←→  Gemini API
      ↕
[PostgreSQL]  [Supabase Storage]
```

**Безопасность (152-ФЗ):** Полный отказ от биометрии (видео/аудио) на этапе MVP. Работа только с текстом и документами.

## Key DB Models

```
User · OnboardingProfile
SpeechDraft · AIAnalysisResult · PDFExport
SimulationSession · SimulationMessage · SkillMetric
```

## Key API Endpoints

```
POST /documents/upload            → Upload document to Supabase
GET  /documents                   → List user documents
POST /simulation/start            → Initialize new simulation session
POST /simulation/{id}/message     → Send message & get AI response (JSON with reasoning)
GET  /simulation/{id}/history     → Get full chat history from PostgreSQL
```

## Current Progress

- [x] **Frontend Shell**: Sidebar (Desktop/Mobile), Dashboard Layout.
- [x] **Auth**: Logic and Styles for Signup/Login pages.
- [x] **Documents**: Page with grid view of uploaded files.
- [x] **Simulation**: Setup page (Persona & Industry selection).
- [ ] **Backend**: In development (FastAPI + SQLALchemy).

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
- Commit messages in **Russian**
- Before starting any feature: create branch from `main`

## Code Conventions

- **Language:** code and comments in English, commits in Russian
- **Python:** follow PEP 8, use type hints, Pydantic v2 models
- **TypeScript:** strict mode, no `any`, functional components (Next.js 15 Server/Client)
- **API:** RESTful, consistent error responses `{detail: string, code: string}`
- **Tests:** write tests for new backend endpoints (pytest), critical frontend paths (Playwright)
- **Design:** Premium dark theme, Framer Motion for micro-animations, pixel-perfect UX

## Communication

- Speak with user in **Russian**
- Report progress concisely — lead with what was done
- When blocked: explain clearly, propose alternatives
- Mention branch creation and commits briefly
