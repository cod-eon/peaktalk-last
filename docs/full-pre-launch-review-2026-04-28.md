# PeakTalk — Полное техническое ревью перед запуском

**Дата:** 2026-04-28
**Ветка:** `cod-eon/style/dashboard-analytics-redesign`
**Стек:** Next.js 16 + FastAPI 0.115 + SQLAlchemy 2.0 (async) + Celery 5.4 + Redis + PostgreSQL + Supabase Auth + YooKassa
**Ревьюер:** Автоматизированный полный аудит (код, инфраструктура, безопасность, UX)

---

## Сводная таблица критичности

| Серьёзность | Количество | Описание |
|---|---|---|
| **CRITICAL / P0** | 12 | Блокируют запуск. Срочное исправление. |
| **HIGH / P1** | 14 | Серьёзные проблемы. Исправить до запуска. |
| **MEDIUM / P2** | 18 | Средние проблемы. Исправить в первые 2 недели. |
| **LOW / P3** | 15 | Улучшения качества. Можно отложить. |

---

## P0 — CRITICAL (блокируют запуск)

### P0-1. Хардкод секретов в репозитории

**Файлы:** `backend/.env`, `frontend/.env.local`, `.env.local`

В файлах `.env`, доступных в репозитории, содержатся реальные production-ключи:
- Supabase `service_role` key (полный админ-доступ, обходит RLS)
- Cloud.ru API key (`MjZjMzc0Y2QtMDI0MC00OTE4LWIyMTAtNTJiY2RkNjE5NjFj...`)
- DevCycle Server SDK Key (`dvc_server_39b57270...`)

`backend/.gitignore` **НЕ исключает** `.env`.

**Действие:** Немедленно ротировать ВСЕ ключи. Добавить `.env` в `.gitignore`. Проверить `git log --all --full-history -- '*.env*'`.

---

### P0-2. Runtime crash: `async_session_maker` не существует

**Файл:** `backend/app/routers/simulation.py:67`

```python
from app.database import async_session_maker
```

Переменная называется `AsyncSessionLocal` (в `database.py`). Импорт вызовет `ImportError` при выполнении background tasks.

---

### P0-3. Runtime crash: `SessionStatus.IN_PROGRESS` не существует

**Файл:** `backend/app/routers/simulation.py:997`

Enum `SessionStatus` содержит только `active`, `completed`, `cancelled`. Значение `IN_PROGRESS` отсутствует — `ValueError` при вызове endpoint `/simulation/from-guest`.

---

### P0-4. Runtime crash: перепутан порядок аргументов

**Файл:** `backend/app/routers/simulation.py:982-983`

```python
await consume_session_credit(db, current_user.id)
await increment_simulation_counter(db, current_user.id)
```

Функции ожидают `(user_id: str, db: AsyncSession)`, а вызываются как `(db, user_id)`. Runtime `AttributeError`.

---

### P0-5. Runtime crash: `MessageRole.system` не существует

**Файл:** `backend/app/routers/simulation.py:1017`

Enum `MessageRole` содержит только `user` и `assistant`. `MessageRole.system` вызовет `ValueError` для гостевых сессий с системными сообщениями.

---

### P0-6. Race condition в счётчиках использования

**Файл:** `backend/app/services/limits.py`

`increment_simulation_counter` читает значение, инкрементирует в Python, затем записывает. Два параллельных запроса прочитают одинаковое значение → lost update. То же для `consume_session_credit` и `increment_document_counter`.

**Действие:** Использовать `UPDATE ... SET simulations_used = simulations_used + 1` или `SELECT ... FOR UPDATE`.

---

### P0-7. Нет Error Boundaries на фронтенде

Во всём приложении **ноль** `ErrorBoundary` и `error.tsx` файлов. Любой необработанный runtime error → белый экран смерти.

**Действие:** Добавить `error.tsx` в каждый route group: `(auth)`, `(dashboard)`, `simulation`, `admin`.

---

### P0-8. Диск сервера заполнен на 83% (4.8 GB свободно)

**Сервер:** 82.202.138.247, 30 GB диск, 24 GB занято.

Docker-образы занимают ~4 GB. Логи Docker не очищаются. При активном использовании диск заполнится за 1-2 недели.

**Действие:**
1. Настроить `log-opt max-size=10m max-file=3` для Docker-контейнеров
2. Добавить `docker image prune` в cron
3. Удалить неиспользуемые образы (`peaktalk-api:latest`, `peaktalk-migrate:latest`)

---

### P0-9. Нет swap на сервере

При 3.8 GB RAM и отсутствии swap, всплеск нагрузки (несколько одновременных AI-симуляций) приведёт к OOM kill.

**Действие:** Добавить swap файл 2-4 GB.

---

### P0-10. Фронтенд сыпет ошибки "Failed to find Server Action"

Docker-логи `peaktalk-frontend-1` содержат десятки ошибок:
```
Error: Failed to find Server Action "x". This request might be from an older or newer deployment.
```

Это version skew — клиенты кэшируют старые Server Action ID. Необходимо включить `skipTrailingSlashRedirect` и/или настроить `deploymentId` в `next.config.ts`.

---

### P0-11. Rate limiting не работает (все пользователи share одну квоту)

**Файл:** `backend/app/limiter.py:8-13`

Rate limiter использует `get_remote_address()`, который за Nginx всегда возвращает IP контейнера Nginx, а не клиента. Все пользователи делят одну rate limit квоту.

**Действие:** Использовать `request.headers.get("X-Real-IP", get_remote_address(request))`.

---

### P0-12. `isPro()` всегда возвращает `false`

**Файл:** `frontend/src/store/billingStore.ts:47-49`

```typescript
isPro: () => {
    const { status } = get();
    if (!status) return false;
    return false || false;  // Всегда false!
},
```

PRO-функционал недоступен ни одному пользователю.

---

## P1 — HIGH (исправить до запуска)

### P1-1. Неавторизованный endpoint рассылки email

**Файл:** `backend/app/routers/email_campaigns.py:21`

`POST /email/weekly-digest` не требует авторизации. Любой может отправить mass email до 500 пользователей.

---

### P1-2. Webhook secret не проверяется

**Файл:** `backend/app/routers/webhooks.py:44-46`

```python
if not settings.supabase_webhook_secret:
    return  # Skip verification (dev mode)
```

`.env` содержит `SUPABASE_WEBHOOK_SECRET=dev-webhook-secret-change-in-production` — placeholder. Любой может удалить любого пользователя через webhook.

---

### P1-3. YooKassa webhook без криптографической проверки

**Файл:** `backend/app/routers/webhooks.py:287-298`

Проверяется только IP-адрес (можно подделать через X-Forwarded-For). Нет HMAC signature verification. В development mode проверка IP отключена полностью.

---

### P1-4. Supabase service_role key как основной ключ

**Файл:** `backend/app/dependencies.py:26`, `backend/app/services/storage.py:14`

Backend создаёт Supabase клиент с `service_role` key — полные права, обходит RLS. Взлом backend = полный доступ ко всем данным.

---

### P1-5. Admin доступ по email без ролей в БД

**Файл:** `backend/app/routers/admin.py:68-81`

Admin-доступ = совпадение email с `ADMIN_EMAILS` env variable. Нет ролей в БД, нет audit trail. Смена email = потеря/получение admin.

---

### P1-6. Re-registration удаляет данные пользователя

**Файл:** `backend/app/dependencies.py:79-98`

При повторной регистрации (новый Supabase UUID, тот же email) старый пользователь удаляется с cascade. Timing-based check может сработать ложно.

---

### P1-7. Отсутствующие индексы в БД

| Таблица | Столбец | Влияние |
|---|---|---|
| `simulation_sessions` | `document_id` | Медленные JOIN при загрузке сессий |
| `simulation_sessions` | `draft_id` | Медленные запросы черновиков |
| `simulation_sessions` | `status` | Full scan при фильтрации по статусу |
| `simulation_messages` | `(session_id, turn_index)` | Sort на каждую загрузку сообщений |
| `speech_drafts` | `document_id` | Seq scan при list_documents |
| `notifications` | `created_at` | Filesor при ORDER BY |
| `scenario_analytics` | `(scenario_id, period_start)` | Медленная аналитика |

---

### P1-8. Отсутствует CSP (Content-Security-Policy) header

В HTTP-ответах нет `Content-Security-Policy`. Это критический заголовок для предотвращения XSS.

---

### P1-9. N+1 запрос в progress/narrative

**Файл:** `backend/app/routers/simulation.py:1093-1155`

Загружает ВСЕ завершённые сессии с `selectinload(skill_metrics)` в память. Без пагинации. Для пользователя с 100+ сессиями — O(n) memory growth.

---

### P1-10. `get_db()` коммитит на каждый запрос

**Файл:** `backend/app/database.py:31-38`

Auto-commit после каждого endpoint, включая GET-запросы. Ненужная нагрузка на WAL PostgreSQL.

---

### P1-11. God component: simulation/page.tsx (1365 строк)

**Файл:** `frontend/src/app/(dashboard)/simulation/page.tsx`

Один файл содержит 20+ state переменных, wizard на 4 шага, историю с KPI, document combobox, persona selection. Нужно разбить на 5+ компонентов.

---

### P1-12. Дублирование state management для billing

`useBilling` hook синхронизирует TanStack Query → Zustand store, создавая dual-write pattern. `billingStore.fetchStatus` никогда не вызывается из hook.

---

### P1-13. Dead dependencies (43 MB в node_modules)

- `three` (37 MB) — нигде не импортируется
- `@splinetool/react-spline` + `@splinetool/runtime` (6.5 MB) — не используются
- `@types/three` — типы для неиспользуемого пакета

---

### P1-14. God component: page.tsx (845 строк, лендинг)

**Файл:** `frontend/src/app/page.tsx`

12 компонентов в одном файле. `Nav`, `Hero`, `PricingCTA`, `FAQAndTrust`, `Footer` нужно вынести.

---

## P2 — MEDIUM (исправить в первые 2 недели)

### P2-1. Raw `dict` вместо Pydantic моделей

**Файлы:** `personas.py`, `meetings.py`, `feedback.py`, `notifications.py`

Endpoint'ы принимают `body: dict` без валидации. Нет генерации OpenAPI схем. Есть mass assignment risk в `personas.py:96` через `setattr`.

---

### P2-2. Mass assignment в persona update

**Файл:** `backend/app/routers/personas.py:95-101`

```python
for field in ("name", "role", "age", ...):
    if field in body:
        setattr(persona, field, body[field])
```

Нет type validation: `age` может быть отрицательным, `name` — мегабайтной строкой.

---

### P2-3. WebSocket manager не переподключается к Redis

**Файл:** `backend/app/ws_manager.py:72-82`

При потере Redis Pub/Sub соединения listener task тихо умирает. Real-time уведомления перестают работать до перезапуска сервера.

---

### P2-4. `asyncio.get_event_loop()` deprecated

**Файлы:** `cloud_ru_ai.py`, `simulation_ai.py`

Используется deprecated API (с Python 3.10). Заменить на `asyncio.get_running_loop()` или `asyncio.to_thread()`.

---

### P2-5. Redis `KEYS` в cache invalidation

**Файл:** `backend/app/cache.py:63-72`

`await r.keys(f"{prefix}:*")` — O(N) по всем ключам, блокирует Redis. Заменить на `SCAN`.

---

### P2-6. Нет ограничения длины текстовых полей

Meeting descriptions, persona names, feedback text — без length limit. Можно хранить мегабайты текста.

---

### P2-7. Open redirect в auth callback

**Файл:** `frontend/src/app/auth/callback/route.ts:8`

`next` параметр из URL используется без валидации. `?next=//evil.com` может сработать.

---

### P2-8. File upload path traversal risk

**Файл:** `backend/app/services/storage.py:17`

`filename` из `file.filename` используется без санитизации. Имена с `../` могут вызвать проблемы.

---

### P2-9. SQL echo mode в логах

**Файл:** `backend/app/database.py:12`

При `DEBUG=true` SQLAlchemy логирует все SQL с параметрами — включая email, текст документов, persona configs.

---

### P2-10. Global mutable singletons

**Файлы:** `cache.py:24`, `dependencies.py:20`, `storage.py:12`

Redis/Supabase клиенты через `global None` singleton — не thread-safe, не тестируемые. Использовать DI через `Depends` или `@lru_cache`.

---

### P2-11. CORS `allow_methods=["*"]`

**Файл:** `backend/app/main.py:70-76`

Слишком разрешительная CORS-политика. Ограничить до `GET, POST, PATCH, DELETE, OPTIONS`.

---

### P2-12. Нет CHECK constraints в БД

- `skill_metrics.score` — нет ограничения 0.0-1.0
- `scenarios.recommended_difficulty` — нет ограничения 1-5
- `guest_sessions.messages` JSON — нет лимита размера

---

### P2-13. Accessibility: отсутствие ARIA labels

Только 32 `aria-` атрибута во всём приложении (14+ компонентов). Критичные проблемы:
- Sidebar logout button без `aria-label`
- Document combobox без `role="combobox"`, `aria-expanded`
- Persona/difficulty кнопки без `aria-pressed`
- Модалки (UpgradeModal) без focus trap
- Labels без `htmlFor` в login/register

---

### P2-14. Контрастность текста не соответствует WCAG AA

- `text-white/58` на тёмных фонах — ~2.8:1 (нужно 4.5:1)
- `text-neutral-400` (#a3a3a3) на белом — ~3.0:1
- `text-white/[0.34]` — почти невидимый текст

---

### P2-15. Нет валидации форм на фронтенде

Нет `zod`, `react-hook-form`, `yup`. Вся валидация manual:
- Password без проверки сложности
- Минимум 20 символов в guest simulation не показан пользователю
- Несогласованные лимиты (50 chars в upload vs 20 в guest)

---

### P2-16. `next-pwa@5.6.0` несовместим с Next.js 15/16

Package не обновлялся и не поддерживает App Router. Конфигурация в `next.config.ts` может вызывать build issues.

---

### P2-17. Billing `isPro()` возвращает `false`

(Дублирует P0-12) Функция `isPro()` в `billingStore.ts` всегда возвращает `false`. PRO-фичи заблокированы.

---

### P2-18. Enum drift в миграциях

Migration 0001 определяет `user_segment` как `student, junior, founder, manager, other`, но модель — `manager, head, founder, customer_facing, other`. Старые значения — zombie entries в PostgreSQL.

---

## P3 — LOW (улучшения качества)

### P3-1. Код-дублирование

- Google SVG icon — 2 раза (login + register)
- `PERSONA_LABELS` — 2 раза (constants/personas.ts + simulation/[id]/page.tsx)
- `formatTime` — 3 раза в разных файлах
- `safariMotionStyle` — 3 раза
- Google OAuth handler — 2 раза

### P3-2. Console.log в production коде

10 `console.*` вызовов в `useSpeechRecognition.ts`, `useWebSocket.ts`, `usePushNotifications.ts`, `upload/page.tsx`.

### P3-3. `hCaptcha` без fallback

`process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY!` — non-null assertion. Если env var отсутствует, captcha молча ломается.

### P3-4. WebSocket token в query parameter

JWT передаётся как URL-параметр для WebSocket. Логируется в access logs и browser history.

### P3-5. Нет `loading.tsx` файлов

Ни в одном route segment нет `loading.tsx`. Suspense fallback — пустота.

### P3-6. Нет `og:image`

Отсутствует `og:image` в metadata. Social sharing будет без превью — критично для конверсии.

### P3-7. `_heuristic_score` возвращает tuple, аннотация — `float`

**Файл:** `backend/app/services/cloud_ru_ai.py:250`

### P3-8. MD5 для хеширования

**Файл:** `backend/app/routers/scenarios.py:130`

`hashlib.md5` используется для daily scenario selection. Лучше `sha256`.

### P3-9. Нет soft delete

Удаление пользователя через `delete_me` — permanent cascade. Нет `deleted_at` для восстановления.

### P3-10. LIKE injection в admin search

**Файл:** `backend/app/routers/admin.py:322`

`%` и `_` в user input не экранируются. Поиск `%` вернёт всех пользователей.

### P3-11. Admin stats = 7 отдельных запросов

Можно объединить в 2-3 запроса с subqueries или `asyncio.gather()`.

### P3-12. Seed script: N+1 запросов

20 отдельных SELECT вместо `WHERE slug IN (...)`.

### P3-13. `react-markdown` без санитизации AI output

AI-generated контент рендерится через `ReactMarkdown`. Если модель сгенерирует malicious HTML — потенциальный XSS.

### P3-14. Неиспользуемые Docker images

`peaktalk-api:latest`, `peaktalk-migrate:latest`, `peaktalk-frontend:latest`, `peaktalk-beat:latest`, `peaktalk-worker:latest` — занимают ~2 GB.

### P3-15. Нет backup стратегии

Нет `pg_dump`, WAL archiving или backup verification. Если Supabase handles backups — не задокументировано.

---

## Инфраструктура — текущее состояние

### Сервер (82.202.138.247)

| Параметр | Значение | Статус |
|---|---|---|
| CPU | 2 cores | Минимально |
| RAM | 3.8 GB | Критично мало |
| Disk | 30 GB (83% занято) | Критично |
| Swap | 0 | Критично |
| OS | Ubuntu 22.04 (kernel 5.15) | OK |
| Docker | 7 контейнеров | OK |

### Docker-контейнеры

| Контейнер | Память | CPU | Статус |
|---|---|---|---|
| nginx | 9 MB | 0% | OK, но ошибки version skew |
| frontend (Next.js) | 63 MB | 0% | OK |
| api (FastAPI/Gunicorn) | 255 MB | 0.47% | OK |
| worker (Celery) | 228 MB | 0.22% | OK |
| beat (Celery Beat) | 52 MB | 0% | OK |
| postgres | 71 MB | 0.01% | OK, 16 connections |
| redis | 8 MB | 0.69% | OK |
| **Итого** | **~686 MB** | — | OK |

### SSL/TLS

| Параметр | Значение |
|---|---|
| Issuer | Let's Encrypt R13 |
| Действует до | 2026-06-18 |
| Протоколы | TLSv1.2, TLSv1.3 |
| OCSP Stapling | Включён |

### Безопасность HTTP-заголовков

| Заголовок | Статус |
|---|---|
| `Strict-Transport-Security` | Присутствует |
| `X-Content-Type-Options` | Присутствует |
| `Referrer-Policy` | Присутствует |
| `X-Frame-Options` | Присутствует |
| `Content-Security-Policy` | **ОТСУТСТВУЕТ** |
| `Permissions-Policy` | **ОТСУТСТВУЕТ** |
| `X-XSS-Protection` | **ОТСУТСТВУЕТ** |

### Производительность (curl до peaktalk.ru)

| Метрика | Значение |
|---|---|
| DNS lookup | 3 ms |
| TLS handshake | 446 ms |
| First byte (TTFB) | 944 ms |
| Total load time | 1.25 s |
| HTML size | 72 KB |
| Postgres connections | 16 / 100 |

### Nginx конфигурация

- Variable-based proxy_pass (правильно для Docker DNS)
- Rate limiting: API 60 req/min, Upload 10 req/min
- HTTP→HTTPS redirect
- WebSocket upgrade support
- Certbot ACME challenge support
- Webhooks path напрямую к FastAPI
- Max upload 55 MB

---

## Позитивные находки

Проект делает многое правильно:

1. **SQL Injection защита** — все запросы через SQLAlchemy ORM, параметризованные
2. **JWT авторизация** — токены валидируются на каждом endpoint через `get_current_user`
3. **Ownership checks** — документы, черновики, сессии проверяют принадлежность пользователю
4. **Rate limiting infrastructure** — SlowAPI интегрирован (хоть и не работает корректно)
5. **HTTPS enforcement** — HSTS, редирект HTTP→HTTPS
6. **File upload validation** — whitelist content types, size limits
7. **Docker Compose** — хорошо структурированный, health checks
8. **Alembic migrations** — 17 миграций
9. **SEO** — robots.ts, sitemap.ts, JSON-LD, OpenGraph
10. **Environment separation** — Swagger отключён в production
11. **Celery worker + beat** — корректная настройка, periodic tasks работают
12. **Health checks** — Docker health checks для всех критичных сервисов

---

## Приоритетный план действий

### БЛОКАТОРЫ — Перед запуском (сегодня)

| # | Задача | Время |
|---|---|---|
| 1 | Ротировать ВСЕ секреты (Supabase, Cloud.ru, DevCycle) | 30 мин |
| 2 | Исправить 4 runtime crash (P0-2 через P0-5) | 1-2 часа |
| 3 | Добавить swap на сервер (2-4 GB) | 10 мин |
| 4 | Очистить Docker logs + unused images | 15 мин |
| 5 | Настроить `log-opt` для Docker containers | 15 мин |
| 6 | Добавить авторизацию на `/email/weekly-digest` | 15 мин |
| 7 | Сделать webhook secret обязательным | 15 мин |
| 8 | Исправить rate limiter (X-Real-IP) | 30 мин |
| 9 | Исправить `isPro()` в billingStore | 15 мин |
| 10 | Добавить CSP header в nginx | 30 мин |

### Первая неделя после запуска

1. Добавить Error Boundaries (`error.tsx`)
2. Добавить недостающие индексы в БД
3. Исправить race condition в счётчиках
4. Разбить god components
5. Удалить dead dependencies (three, spline)
6. Добавить `loading.tsx` файлы
7. Добавить `og:image`
8. Исправить "Failed to find Server Action" (version skew)

### Вторая неделя

1. Заменить `dict` на Pydantic модели
2. Исправить accessibility (ARIA, contrast, focus traps)
3. Исправить N+1 запросы
4. Добавить YooKassa HMAC signature verification
5. Добавить CHECK constraints в БД
6. Добавить form validation (zod/react-hook-form)
7. Заменить `asyncio.get_event_loop()` на `asyncio.to_thread()`

---

## Ссылки на ресурсы

- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Next.js Security Best Practices 2026](https://digiqt.com/blog/nextjs-security-best-practices/)
- [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security)
- [Next.js 15 Production Checklist](https://srivathsav.me/blog/nextjs-15-production-checklist)
- [Conversational AI Pre-Launch Checklist (LivePerson)](https://www.liveperson.com/blog/ai-readiness-checklist/)
- [B2B SaaS Launch Checklist 2026](https://gtmbuddy.ai/blog/b2b-saas-product-launch-checklist)
- [AI Feature Ship Checklist (Reddit)](https://www.reddit.com/r/SaaS/comments/1set4p2/before_you_ship_an_ai_feature_to_saas_users_the/)
