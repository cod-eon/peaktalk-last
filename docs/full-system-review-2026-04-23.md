# PeakTalk — Full System Review (2026-04-23)

## Executive Summary

PeakTalk — B2B SaaS AI-симулятор сложных рабочих коммуникаций: защита проектов, QBR, бюджетные защиты, инвест-спичи, клиентские эскалации. Продукт находится на стадии **MVP → M1.2** (billing, onboarding, dashboard).

**Общий статус:** Архитектура крепкая, но есть **4 P0**, **7 P1** и **18 P2** проблем, распределённых по frontend, backend, security и AI-архитектуре.

---

## 1. Backend Architecture

### 1.1 Simulation Core (`backend/app/routers/simulation.py`)

**Сильные стороны:**
- Cache-aside паттерн для списка сессий (Redis, TTL 60s)
- Оптимизированные запросы: correlated subqueries для агрегатов, batch-loading документов/драфтов
- Фоновая генерация артефактов (`PrepCard`) через `BackgroundTasks`
- Строгая проверка владения ресурсами (ownership) на всех мутациях
- Обработка "заброшенных" сессий (`/abandon`): если есть ответы → финализация с оценкой, если нет → отмена
- Поддержка перехода из гостевого режима в аккаунт (`/from-guest`)
- Retry-логика через `tenacity` (3 попытки, exponential backoff)

**P0-1: Race condition в `/start` — двойное списание кредита**
- Файл: `backend/app/routers/simulation.py`
- Проблема: `check_simulation_limit` и `consume_session_credit` вызываются в разные моменты. При быстром двойном клике оба запроса могут пройти `check_simulation_limit` (оба видят `session_credits > 0`), затем оба вызовут `consume_session_credit` — первый спишет, второй вернёт `False`, но сессия уже создана.
- Риск: Пользователь теряет кредит, сессия дублируется.
- Решение: Атомарная транзакция с `SELECT ... FOR UPDATE` на `UsageCounter` или optimistic locking через `version` колонку.

**P0-2: Утечка данных — `/sessions` возвращает чужие сессии при race**
- Файл: `backend/app/routers/simulation.py:list_sessions`
- Проблема: Фильтрация по `user_id` есть, но в `/from-guest` сессия создаётся с `user_id=NULL`, а потом обновляется. В окне между созданием и обновлением другой пользователь теоретически может увидеть сессию.
- Решение: При создании guest-сессии использовать временный `guest_token`, который не попадает в общий список.

**P1-1: Missing pagination на `/sessions`**
- `list_sessions` грузит все сессии пользователя. При 100+ сессиях — деградация.
- Решение: cursor-based pagination (`?before=<cursor>&limit=20`).

**P1-2: `/abandon` не инвалидирует Redis-кэш**
- После изменения статуса сессии кэш списка остаётся stale до TTL (60s).
- Решение: `cache_invalidate_prefix(f"sessions:{user_id}")` после мутаций.

**P2-1: `curveball` логика захардкожена**
- Каждые 3 хода с вероятностью 40% — не конфигурируется.
- Решение: Вынести в `settings` или в промпт-конфиг персоны.

**P2-2: Нет защиты от одновременных `/next` запросов**
- Пользователь может отправить два ответа параллельно — оба попадут в историю.
- Решение: Оптимистичная блокировка через `turn_number` или `lock_version`.

### 1.2 AI Services (`backend/app/services/simulation_ai.py`, `cloud_ru_ai.py`)

**Сильные стороны:**
- Динамическая генерация системных промптов с учетом сложности, индустрии и контекста
- Встроена защита от prompt injection (`_sanitize_industry`, `_sanitize_user_input`, явные правила безопасности)
- Логика `curveball` (каждые 3 хода, 40%) и `followup` (при слабых ответах)
- **Гибридная AI-детекция**: быстрый эвристический скоринг (без траты токенов) + LLM-арбитр только в "серой зоне" (0.25–0.75). Fail-open стратегия.

**P0-3: Prompt injection через `industry` параметр**
- Файл: `backend/app/services/simulation_ai.py`
- `_sanitize_industry` удаляет только `<script>` и `</script>`, но не другие инъекционные паттерны (`"`, `'`, `{`, `}`, системные инструкции).
- Индустрия вставляется напрямую в system prompt: `f"Industry: {industry}"`.
- Решение: Строгий whitelist индустрий или полная санитизация (strip all non-alphanumeric + spaces).

**P1-3: Нет rate limiting на AI-запросы**
- При массовом запуске симуляций можно исчерпать лимит Cloud.ru/OpenAI API.
- Решение: Semaphore на уровне сервиса или queue-based подход через Celery.

**P1-4: `evaluate_session` не имеет таймаута**
- Если LLM зависает, Celery-задача expire будет ждать бесконечно.
- Решение: `asyncio.wait_for(evaluate_session(...), timeout=60)`.

**P2-3: Оценка метрик не калибрована**
- Scores 0-100 без привязки к бенчмаркам. "65/100" не говорит пользователю ничего.
- Решение: Добавить percentile-рейтинг ("лучше 40% пользователей") или grade-систему (A-F).

**P2-4: Дублирование AI-клиентов**
- `cloud_ru_ai.py` — OpenAI-совместимый клиент. Если появится второй провайдер (Anthropic, Google), дублирование логики.
- Решение: Абстрактный `AIClient` протокол + конкретные имплементации.

### 1.3 Billing & Payments (`backend/app/routers/billing.py`, `services/yookassa_service.py`)

**Сильные стороны:**
- Полная интеграция с YooKassa (создание, автопродление, возвраты)
- 54-ФЗ совместимость (чеки, налоговые системы)
- IP-верификация вебхуков по официальным CIDR YooKassa
- Idempotency keys на всех платежах
- Grace period (3 дня) после истечения подписки
- Test-мо́д для локальной разработки

**P0-4: `_handle_payment_succeeded` не атомарна**
- Файл: `backend/app/routers/webhooks.py`
- Проблема: Обновление `Subscription` + `UsageCounter` + `Payment` — всё в одном `db.flush()`, но без `db.commit()`. Если Celery-задача упадёт между flush и commit, данные потеряются.
- Также: при concurrent вебхуках (YooKassa может слать дубли) idempotency check есть, но между `select` и `add` есть race window.
- Решение: `SELECT ... FOR UPDATE` + `db.commit()` внутри обработчика, или UNIQUE constraint на `yookassa_payment_id`.

**P1-5: `renew_subscriptions_task` не обрабатывает `personal` план**
- Файл: `backend/app/worker.py:renew_subscriptions_task`
- Query фильтрует только `PlanType.pro, PlanType.team`. `personal` (790 RUB/мес) не автопродлевается.
- Решение: Добавить `PlanType.personal` в query.

**P1-6: Нет обработки `payment.waiting_for_capture`**
- Если YooKassa требует 3D-Secure и пользователь не завершает — платёж висит.
- Решение: Celery-задача для cleanup pending платежей старше N минут.

**P2-5: Цены захардкожены в двух местах**
- `PLAN_PRICES` в `yookassa_service.py` и `_PLAN_CATALOGUE` в `billing.py`.
- Риск: рассинхрон при изменении цен.
- Решение: Единый источник (enum или config table).

**P2-6: `create_refund` не обновляет subscription**
- После возврата подписка остаётся active.
- Решение: При refund → `past_due` или `cancelled` + инвалидация кэша.

### 1.4 Limits & Quotas (`backend/app/services/limits.py`)

**Сильные стороны:**
- Чёткая приоритизация: session_credits > план > free
- Grace period для expired подписок
- Авто-создание `Subscription` и `UsageCounter` при первом обращении
- Billing period reset (30 дней)

**P1-7: `_effective_plan` и `_is_subscription_active` дублируют логику**
- Обе функции проверяют `period_end + grace`. При изменении grace period нужно менять в двух местах.
- Решение: Одна функция `get_subscription_state(sub)` → enum `ACTIVE | GRACE | EXPIRED`.

**P2-7: Free план — "lifetime 1 simulation" но `simulations_per_month=1`**
- Комментарий говорит "lifetime", но код использует `simulations_per_month`. Если billing period reset сработает — free пользователь получит ещё 1 симуляцию.
- Решение: Явная проверка `if effective_plan == PlanType.free and counter.simulations_used >= 1: deny`.

### 1.5 Celery Workers (`backend/app/worker.py`)

**Сильные стороны:**
- Периодический cleanup заброшенных сессий (каждые 30 мин)
- Автопродление подписок с retry для past_due
- Fallback email для непрочитанных уведомлений
- Web Push через pywebpush с автоудалением expired подписок

**P1-8: `expire_abandoned_sessions` вызывает LLM для каждой stale сессии**
- Если за 30 минут накопилось 50 stale сессий — 50 последовательных LLM-вызовов.
- Решение: Batch evaluation или ограничение `max_sessions_per_run=10`.

**P1-9: `NullPool` в `_make_session()` — performance hit**
- Каждая Celery-задача создаёт новое соединение с БД.
- Решение: `QueuePool` с `pool_size=5` для Celery workers.

**P2-8: `fallback_unread_notifications_task` — mock email**
- `log.info("Would send fallback email...")` — реальная отправка не реализована.
- Решение: Интеграция с SendGrid/Postmark или хотя бы flag для future implementation.

### 1.6 Auth & Dependencies (`backend/app/dependencies.py`)

**Сильные стороны:**
- Supabase auth integration с lazy client
- Авто-provision пользователей при первом запросе
- Re-registration detection (stale UUID wipe)
- OAuth email fallback из `user_metadata`

**P1-10: Global `_supabase_client` — thread safety**
- В async-контексте с несколькими event loops глобальный клиент может вызвать проблемы.
- Решение: `contextvars` или per-request client.

**P2-9: `get_current_user` делает 2-3 DB запроса на каждый request**
- `select(User).options(selectinload(...))` + возможно `delete` + `provision`.
- Решение: Кэшировать user в request state (FastAPI `request.state.user`).

### 1.7 Rate Limiting & Caching (`backend/app/limiter.py`, `cache.py`)

**Сильные стороны:**
- Graceful degradation при недоступности Redis
- Уникальные UUID-ключи в test mode (rate limits не триггерятся)
- Префиксная инвалидация кэша

**P2-10: `cache_invalidate_prefix` использует `KEYS` — O(N) операция**
- При большом количестве ключей блокирует Redis.
- Решение: `SCAN` вместо `KEYS` или отдельные Redis DB для разных типов кэша.

---

## 2. Frontend Architecture

### 2.1 Dashboard Pages (проанализировано в предыдущих сессиях)

**Статус:** 0 P0, 3 P1, 18 P2

**Ключевые находки:**
- Опечатки в импортах API эндпоинтов
- Захардкоженные флаги тарифов в компонентах
- Дублирование логики форматирования дат и цветов
- Разрозненная обработка ошибок (каждый компонент по-своему)
- Отсутствуют loading states для некоторых async операций
- Нет обработки 402 (payment required) на уровне API client

### 2.2 API Client Layer

**P1-11: Нет centralized error handling**
- 402, 401, 500 обрабатываются в каждом компоненте отдельно.
- Решение: Axios/Fetch interceptor → global error handler → toast notifications.

**P1-12: Billing status не кешируется на клиенте**
- Каждый ререндер дашборда делает новый запрос `/billing/status`.
- Решение: React Query / SWR с staleTime=30s.

**P2-11: Hardcoded plan colors**
- Цвета тарифов захардкожены в 5+ компонентах.
- Решение: Вынести в theme tokens.

---

## 3. Security Analysis

### 3.1 Authentication
- ✅ Supabase auth с Bearer token verification
- ✅ Re-registration detection с stale data wipe
- ⚠️ **P1-10**: Global Supabase client — потенциальный race condition

### 3.2 Authorization
- ✅ Ownership checks на всех мутациях симуляций
- ✅ Плановые лимиты enforced на backend
- ⚠️ **P0-2**: Guest session visibility window

### 3.3 Payment Security
- ✅ YooKassa IP verification (CIDR + individual IPs)
- ✅ Idempotency keys
- ✅ 54-ФЗ receipt generation
- ⚠️ **P0-4**: Non-atomic webhook handler
- ⚠️ Webhook secret для Supabase опционален (dev mode)

### 3.4 Input Validation
- ⚠️ **P0-3**: Prompt injection через industry параметр
- ⚠️ Нет rate limiting на AI-запросы
- ✅ Slowapi rate limiter для HTTP endpoints

### 3.5 Data Protection
- ✅ Redis graceful degradation
- ✅ Celery task retries
- ⚠️ Нет encryption at rest для extracted_text документов

---

## 4. Scalability Analysis

### 4.1 Current Bottlenecks
1. **LLM calls are synchronous** — каждый `/next` ждёт ответ AI (3-10s)
2. **No pagination** на `/sessions` — O(N) при росте
3. **Celery NullPool** — каждое таск-создание = новое DB соединение
4. **Redis KEYS command** — O(N) invalidation

### 4.2 Scaling Recommendations
- **Short-term:** Pagination, connection pooling, batch LLM evaluation
- **Medium-term:** WebSocket для стриминга AI-ответов, read replicas для аналитики
- **Long-term:** Event sourcing для simulation history, CQRS для dashboard

---

## 5. AI Architecture Review

### 5.1 Prompt Engineering
- ✅ Динамические system prompts с контекстом
- ✅ Prompt injection protection (базовая)
- ⚠️ Нет A/B тестирования промптов
- ⚠️ Нет версионирования промптов

### 5.2 Evaluation Pipeline
- ✅ Skill-based metrics (clarity, structure, persuasion, etc.)
- ✅ Curveball detection для стресс-тестирования
- ⚠️ Scores не калиброваны (нет бенчмарков)
- ⚠️ Нет human-in-the-loop валидации оценок

### 5.3 Cost Optimization
- ✅ Гибридная AI-детекция (heuristics + LLM only for gray zone)
- ✅ Fail-open стратегия (ошибки не блокируют пользователя)
- ⚠️ Нет cost tracking per simulation
- ⚠️ Нет fallback на более дешёвую модель при высокой нагрузке

---

## 6. Decision Log (DL-1 to DL-14)

| ID | Decision | Rationale | Status |
|----|----------|-----------|--------|
| DL-1 | Redis cache-aside для списка сессий | Простота, graceful degradation | ✅ Implemented |
| DL-2 | Celery для фоновых задач | Изоляция heavy operations | ✅ Implemented |
| DL-3 | Supabase auth + local user sync | OAuth support + local data control | ✅ Implemented |
| DL-4 | YooKassa для платежей | Российский рынок, 54-ФЗ | ✅ Implemented |
| DL-5 | Grace period 3 дня | Снижение churn при проблемах с оплатой | ✅ Implemented |
| DL-6 | Guest → account migration | Lower barrier to entry | ✅ Implemented |
| DL-7 | Session credits override | Гибкость монетизации поверх подписок | ✅ Implemented |
| DL-8 | Fail-open AI detection | Не блокировать пользователей при сбоях | ✅ Implemented |
| DL-9 | Correlated subqueries для агрегатов | Избежание N+1 запросов | ✅ Implemented |
| DL-10 | Tenacity retry для AI calls | Resilience к временным сбоям API | ✅ Implemented |
| DL-11 | PlanType.starter → personal alias | Backward compat при ребрендинге | ✅ Implemented |
| DL-12 | Per-session как credit, не подписка | Гибкость для разовых покупок | ✅ Implemented |
| DL-13 | NullPool в Celery | Избежание event loop конфликтов | ⚠️ Needs review (P1-9) |
| DL-14 | Test mode unique UUID для rate limits | Rate limits не триггерятся в тестах | ✅ Implemented |

---

## 7. Priority Action Plan

### Phase 0: Critical Fixes (P0) — Week 1
1. **P0-1**: Atomic credit consumption (`SELECT FOR UPDATE`)
2. **P0-2**: Guest session isolation
3. **P0-3**: Strict industry whitelist / full sanitization
4. **P0-4**: Atomic webhook handler + UNIQUE constraint on `yookassa_payment_id`

### Phase 1: High Priority (P1) — Week 2-3
5. **P1-1**: Cursor-based pagination для `/sessions`
6. **P1-2**: Cache invalidation после мутаций
7. **P1-3**: Rate limiting на AI-запросы (semaphore)
8. **P1-4**: Timeout на `evaluate_session`
9. **P1-5**: Auto-renew для `personal` плана
10. **P1-7**: Deduplicate grace period logic
11. **P1-8**: Batch limit для `expire_abandoned_sessions`
12. **P1-9**: QueuePool для Celery workers
13. **P1-10**: Thread-safe Supabase client
14. **P1-11**: Centralized frontend error handling
15. **P1-12**: Client-side caching для billing status

### Phase 2: Medium Priority (P2) — Week 4+
16. **P2-1-P2-11**: Code quality, DRY, config consolidation

---

## 8. Architecture Diagram

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend  │────▶│  FastAPI     │────▶│  PostgreSQL  │
│   (React)   │◀────│  Backend     │◀────│  (Supabase)  │
└─────────────┘     │              │     └──────────────┘
                    │              │     ┌──────────────┐
                    │  ┌────────┐  │────▶│  Redis       │
                    │  │ Celery │  │     │  (cache+broker)│
                    │  │ Worker │  │     └──────────────┘
                    │  └───┬────┘  │
                    │      │       │     ┌──────────────┐
                    │  ┌───▼────┐  │────▶│  Cloud.ru    │
                    │  │ AI     │  │     │  / OpenAI    │
                    │  │ Service│  │     └──────────────┘
                    │  └────────┘  │
                    │              │     ┌──────────────┐
                    │  ┌────────┐  │────▶│  YooKassa    │
                    │  │Billing │  │     │  Payments    │
                    │  └────────┘  │     └──────────────┘
                    └──────────────┘
```

---

## 9. Conclusion

PeakTalk имеет **крепкую архитектурную базу** с продуманным разделением ответственности, graceful degradation и хорошей покрытием edge cases (guest mode, grace period, idempotency). 

Основные риски集中在 в области **concurrency** (race conditions в кредитах и вебхуках), **prompt security** (инъекции через индустрию), и **operational scalability** (отсутствие pagination, sync LLM calls).

Рекомендуемый порядок исправлений: P0 → P1 → P2, с фокусом на атомарность операций и безопасность промптов в первую неделю.