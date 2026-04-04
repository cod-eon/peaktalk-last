# PeakTalk — Claude Instructions

## Project

**PeakTalk** — Prosumer/B2B SaaS AI-симулятор трудных корпоративных переговоров, защиты проектов и стресс-тестирования аргументации (защита бюджетов, QBR, сложные управленческие коммуникации, инвест-питчи).

**Core flow:** Пользователь загружает документ (отчет, стратегию, драфт письма) → Ленивый парсинг (Lazy Parsing) перед симуляцией → Настройка параметров (выбор частотного рабочего сценария: токсичный руководитель, защита бюджета, жесткий фидбек, скептичный инвестор) → AI-симуляция Q&A сессии с использованием внутреннего монолога (Internal Reasoning) для поиска логических уязвимостей → Хранение всей истории и мыслей тренера в PostgreSQL для строгой аналитики прогресса. Никакой инфантильной геймификации.

**Target:** Менеджеры среднего и высшего звена, тимлиды и фаундеры. Люди с реальным бюджетом, которым еженедельно нужно защищать свои решения, доказывать метрики или проводить стрессовые разговоры с руководством и стейкхолдерами.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion · TanStack Query · Zustand · next-pwa |
| Backend | Python 3.12 · FastAPI · Celery · Redis |
| DB / Storage | PostgreSQL · SQLAlchemy 2.0 · Supabase Storage |
| AI | Gemini API (gemini-1.5-flash, анализ контента, внутренний монолог тренера, текстовые симуляции) |
| Infra | DDoS-Guard → Yandex CDN → Nginx → FastAPI · 152-ФЗ |

## Architecture

```text
[Next.js 15 PWA]
      ↕ HTTP/REST
[FastAPI — API, auth, CRUD]
      ↕ Redis (task queue)
[Celery AI-worker]  ←→  Gemini API
      ↕
[PostgreSQL]  [Supabase Storage]