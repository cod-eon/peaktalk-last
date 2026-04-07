# PeakTalk — Claude Instructions

## Project

**PeakTalk** — B2B SaaS AI-симулятор сложных рабочих коммуникаций: защита проектов, QBR, бюджетные защиты, инвест-питчи, клиентские эскалации и другие high-stakes разговоры.

Это не consumer-продукт для “публичных выступлений вообще” и не студенческий тренажер.  
Продуктовая суть — **stress-test аргументации до реальной встречи**, а не мотивационный speech coaching.

## Current Product Shape

**Core flow:**  
Document or text input → draft analysis via Gemini → simulation with persona and difficulty → stored session history → skill evaluation → grouping into project context.

### What exists in code

- documents upload / text documents
- drafts + AI analysis
- simulations with persona config and internal reasoning
- skill metrics and session reporting
- projects linking documents and simulations
- subscription plans and billing hooks

## Target

- managers and team leads
- heads of function
- founders
- customer-facing teams
- anyone inside a company who regularly has to defend a position under pressure

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16 · React 19 · TypeScript · Tailwind CSS · Framer Motion · TanStack Query · Zustand |
| Backend | Python 3.12 · FastAPI · SQLAlchemy |
| DB / Storage | PostgreSQL · Supabase Storage |
| AI | Gemini API |
| Infra | Docker Compose · Nginx · rate limiting · request logging |

## Architecture

```text
[Next.js App]
      ↕ HTTP/REST
[FastAPI API]
      ↕
[PostgreSQL]   [Supabase Storage]
      ↕
[Gemini API]
```

## Product Rules

- Keep the narrative B2B and scenario-driven.
- Do not drift into student/B2C positioning.
- Emphasize pressure testing, decision defense, and difficult conversations.
- Avoid infantilizing the product with gamification language.
- If docs conflict, prefer the current codebase shape over older concept texts.
