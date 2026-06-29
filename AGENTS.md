# PeakTalk - инструкции для агентов

## Рабочий режим

PeakTalk ведется в режиме **Controlled Autonomy**: агент сам исследует код, принимает технические решения, реализует изменения и проверяет результат. Пользователь не обязан участвовать в коде руками.

Перед существенными изменениями агент должен сделать короткий gate: что меняется, где риск, какие файлы/флоу затрагиваются, чем будет проверяться. Без gate допустимы только мелкие правки: copy, очевидные CSS-правки, одиночные багфиксы без изменения UX/API/данных.

## Контекст продукта

**PeakTalk** - B2C по модели покупки, но не массовый consumer. Это scenario-driven профессиональный AI-симулятор сложных рабочих коммуникаций: защита проектов, QBR, бюджетные защиты, инвест-спичи, клиентские эскалации и другие high-stakes разговоры.

Продуктовая суть - **stress-test аргументации до реальной встречи**, а не motivational speech coaching.

## Продуктовые рамки

- Сохранять narrative: professional pressure-testing, decision defense, сложные рабочие разговоры.
- Не уводить позиционирование в student, generic public speaking, creator coaching или массовую self-improvement механику.
- Не инфантилизировать продукт геймификацией: никаких achievements, streaks, уровней, бейджей и playful reward language без явного запроса.
- Если документы конфликтуют, приоритет такой: текущий код и `AGENTS.md` -> свежие docs в `docs/` -> старые README/планы.
- Не добавлять фичи "для полноты", если они не усиливают подготовку к реальной high-stakes встрече.

## Технический контекст

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Zustand, TanStack Query.
- Backend: Python 3.12, FastAPI, SQLAlchemy async, Alembic, PostgreSQL, Redis/Celery, Supabase Storage/Auth, YooKassa.
- Важные флоу: landing -> guest simulation -> registration/paywall, dashboard, documents, simulation, meetings, personas, billing, admin.
- Рискованные зоны: auth, billing/credits, guest-to-user conversion, simulation engine, migrations, admin, notifications, PWA/service worker.

## CodeGraph

В репозитории инициализирован CodeGraph (`.codegraph/` в корне), поэтому агент должен использовать его как первый инструмент для понимания и изменения кода.

- Перед `rg`, ручным чтением файлов или правками кода сначала использовать CodeGraph для поиска релевантных символов, флоу и blast radius.
- Основной путь: `codegraph explore "<флоу, символы или вопрос>"`; для точечного чтения файла или символа - `codegraph node <symbol-or-file>`; для оценки вызывающих мест - `codegraph callers <symbol>`.
- Для рискованных зон PeakTalk отдельно проверять через CodeGraph затронутые зависимости: auth, billing/credits, guest-to-user conversion, simulation engine, migrations, admin, notifications, PWA/service worker.
- CodeGraph не заменяет верификацию: после изменений все равно нужны релевантные `lint`, `build`, `pytest`, browser/Playwright checks и deploy-gate по правилам ниже.
- Если задача касается неиндексируемых docs/assets/configs или CodeGraph не возвращает нужный контекст, использовать обычный файловый поиск и явно учитывать это в работе.

## Project Skills

Проектные skills лежат в `.agents/skills/` и должны использоваться проактивно:

- `peaktalk-autonomous-dev-gate` - для любых нетривиальных кодовых задач.
- `peaktalk-ui-quality-gate` - для UI, frontend, layout, responsive, visual polish.
- `peaktalk-product-guard` - для продуктовых решений, новых фич, сценариев, текстов и onboarding/paywall.
- `peaktalk-deploy-gate` - перед деплоем, изменениями infra/env/migrations, post-deploy проверками.
- `peaktalk-copy-seo-guard` - для landing, SEO, metadata, сценарных страниц, маркетинговых текстов.

## UI / Design Rules

Главный failure mode проекта - слабый дизайн. Любая UI-задача должна завершаться визуальной проверкой, а не только успешным build.

- Дизайн-контур: code-first + mandatory screenshot/browser review.
- Figma использовать только если есть Figma-ссылка, макет или явная задача сверки/генерации дизайна.
- В проекте нет обязательного визуального стиля, палитры, шрифтовой пары, радиуса, aesthetic label или preset-дизайна, которому агент должен строго следовать.
- При UI-работе опираться на текущий код, цель задачи, предоставленные макеты/референсы и здравый выбор под конкретный экран. Если задача явно просит редизайн, допустимо менять визуальное направление без оглядки на старый дизайн.
- Для operational screens важнее сканируемость, устойчивые размеры, понятные состояния и быстрые действия, но конкретная эстетика выбирается по контексту задачи.
- После UI-изменений проверять desktop и mobile viewports. Текст не должен пересекаться, выпадать из кнопок, сжимать layout или закрывать интерактивные элементы.

## Verification

Перед заявлением "готово" нужны свежие проверки. Минимум выбирается по зоне изменения:

- Frontend: `npm run lint`, `npm run build` в `frontend/`; для UI также browser/Playwright screenshots.
- Backend: релевантные `pytest` в `backend/`; для схемы БД проверить Alembic migration path.
- Fullstack/API: проверить frontend/backend контракт, auth state, error states, loading states.
- Billing/auth/admin/security: не деплоить при красных проверках или неясной модели данных.

Если проверку невозможно выполнить, явно сказать почему и чем это компенсировано.

## MCP

- Playwright / Browser: использовать для UI-флоу, auth, dashboard/simulation/billing, regression и screenshot review.
- Context7: использовать для актуальной документации библиотек/API, особенно Next.js, React, Tailwind, Supabase, FastAPI, YooKassa.
- Sentry: использовать для prod-ошибок, issue URL, replay, trace, stack trace, incident analysis.
- Supabase: использовать для схемы БД, auth/storage/tables/project settings и проверки данных Supabase.
- Figma: использовать при Figma URL или явной задаче сверки/реализации макета.
- Если пользователь явно ограничил способ работы, это важнее автоматического выбора MCP.

## Deploy Policy

Агент может деплоить после green checks, если задача явно требует выката или продолжение без деплоя не имеет смысла. Перед деплоем обязателен `peaktalk-deploy-gate`: build/test/lint, миграции, env/secrets, health check, post-deploy smoke, rollback plan.
