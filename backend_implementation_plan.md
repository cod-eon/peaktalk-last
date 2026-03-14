# Backend Implementation Plan: PeakTalk MVP

Этот документ описывает архитектуру и шаги реализации бэкенда для AI-тренера публичных выступлений.

---

## 🏗 Технологический стек

| Слой | Технология |
|---|---|
| Язык | Python 3.12 |
| Фреймворк | FastAPI 0.115.0 |
| БД | PostgreSQL + SQLAlchemy 2.0 (Alembic для миграций) |
| Auth | Supabase Auth (JWT) — см. раздел ниже |
| AI | Google Gemini API (gemini-1.5-flash) + tenacity для retry |
| Хранилище | Supabase Storage |
| Фоновые задачи | Celery + Redis (подключается при парсинге > 30 сек или файлах > 10 MB) |
| Rate limiting | slowapi (защита эндпоинтов /auth и /simulation) |

---

## 🔐 Авторизация: Supabase Auth

**Выбор:** Supabase Auth — не кастомная JWT-реализация и не Authentik.

**Почему Supabase Auth:**
- Supabase Storage уже в стеке — один SDK, одна конфигурация
- Email/password, верификация email, password reset — из коробки
- Выдаёт стандартные JWT, которые FastAPI принимает через `python-jose`
- Не требует отдельного сервера авторизации (в отличие от Authentik)
- Есть EU-регион (совместимо с 152-ФЗ при необходимости)

**Как это работает в архитектуре:**

```
[Next.js] → supabase-js → Supabase Auth → JWT токен
[Next.js] → Authorization: Bearer <JWT> → FastAPI
[FastAPI] → verify JWT (python-jose + Supabase public key) → user_id
```

**FastAPI dependency:**
```python
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"])
    user_id = payload.get("sub")
    # загружаем из нашей БД по user_id
```

> Кастомные страницы авторизации в Next.js — используем `supabase-js` напрямую. Supabase Auth управляет пользователями, наш PostgreSQL хранит профили и данные приложения.

---

## 💾 Схема базы данных (SQLAlchemy)

### 1. `User` — Пользователи
```
id: UUID (Primary Key, совпадает с Supabase Auth user_id)
email: String (Unique)
created_at: DateTime
```
> Пароль не хранится — управление паролем на стороне Supabase Auth.

### 2. `OnboardingProfile` — Профиль и цели пользователя
```
id: UUID
user_id: UUID (FK → User, unique)
segment: Enum(student, junior, founder, manager, other)
primary_goal: Enum(interview, pitch, conference, defense, other)
created_at: DateTime
```
> Используется для персонализации AI-промптов под сегмент пользователя.

### 3. `Document` — Загруженные файлы
```
id: UUID
owner_id: UUID (FK → User)
name: String
storage_path: String (путь в Supabase Storage)
file_type: Enum(pitch, prd, speech, other)
extracted_text: Text (кэш после lazy parsing)
parsed_at: DateTime (nullable, None = ещё не парсили)
created_at: DateTime
```

### 4. `SpeechDraft` — Черновики для анализа
```
id: UUID
user_id: UUID (FK → User)
document_id: UUID (FK → Document, nullable)
raw_text: Text (введённый или извлечённый текст)
title: String
created_at: DateTime
```

### 5. `AIAnalysisResult` — Результат анализа черновика
```
id: UUID
draft_id: UUID (FK → SpeechDraft, unique)
improved_text: Text (улучшенная версия)
feedback_json: JSONB (структура: logic, style, clarity, grammar)
created_at: DateTime
```

### 6. `SimulationSession` — Тренировочные сессии
```
id: UUID
user_id: UUID (FK → User)
document_id: UUID (FK → Document, nullable)
draft_id: UUID (FK → SpeechDraft, nullable)
persona_config: JSONB (role, industry, difficulty)
status: Enum(active, completed, cancelled)
created_at: DateTime
completed_at: DateTime (nullable)
```

### 7. `SimulationMessage` — Сообщения сессии
```
id: UUID
session_id: UUID (FK → SimulationSession)
role: Enum(user, assistant)
content: Text
internal_reasoning: Text (nullable, внутренний монолог AI)
turn_index: Integer (порядковый номер хода)
created_at: DateTime
```
> Отдельная таблица вместо JSONB для возможности построения аналитики по отдельным ответам.

### 8. `SkillMetric` — Метрики по итогам сессии
```
id: UUID
session_id: UUID (FK → SimulationSession)
metric_name: String (clarity, argumentation, stress_resistance, ...)
score: Float (0.0–1.0)
comment: Text (nullable)
```

---

## 🔑 Ключевые API эндпоинты

### Auth (делегировано Supabase, FastAPI только верифицирует JWT)
```
Supabase Auth handles: signup, login, logout, password reset, email verify
FastAPI:
  GET /me                           → профиль текущего пользователя
  POST /me/onboarding               → сохранить OnboardingProfile
```

### Документы
```
POST /documents/upload              → загрузить файл в Supabase Storage
GET  /documents                     → список документов пользователя
DELETE /documents/{id}              → удалить документ и файл
```

### Анализ (SpeechDraft)
```
POST /drafts                        → создать черновик (текст или из документа)
POST /drafts/{id}/analyze           → запустить AI-анализ → AIAnalysisResult
GET  /drafts/{id}/analysis          → получить результат анализа
```

### Симуляция
```
POST /simulation/start              → создать сессию (выбор документа/черновика + персоны)
POST /simulation/{id}/message       → отправить ответ → получить следующий вопрос AI (JSON с reasoning)
GET  /simulation/{id}/history       → история сессии (все SimulationMessage)
POST /simulation/{id}/complete      → завершить сессию → запустить генерацию SkillMetric
GET  /simulation/{id}/report        → финальный отчёт с метриками
```

---

## 🤖 Интеграция с Gemini API

### Структура ответа (Structured Output)
```python
class GeminiSimulationResponse(BaseModel):
    internal_reasoning: str   # внутренний монолог тренера
    question: str             # вопрос пользователю
    difficulty_level: int     # 1-5
```

### Retry-логика (tenacity)
```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(GeminiAPIError),
)
async def call_gemini(prompt: str) -> GeminiSimulationResponse:
    ...
```

### Сборка контекста для симуляции
```
System Instruction:
  ← persona_config (роль, индустрия, стиль)
  ← OnboardingProfile пользователя (сегмент, цель)
User Context:
  ← extracted_text документа (lazy parsing перед первым вопросом)
  ← последние N сообщений из SimulationMessage (скользящее окно)
```

---

## 🛠 Этапы реализации

### Этап 1: Инфраструктура и Auth
- [ ] Структура проекта: `app/main.py`, `app/config.py`, `app/database.py`
- [ ] Alembic: первая миграция для `User` + `OnboardingProfile`
- [ ] FastAPI dependency `get_current_user` — верификация Supabase JWT
- [ ] Подключение slowapi rate limiting для всех защищённых эндпоинтов
- [ ] `GET /me` и `POST /me/onboarding`

### Этап 2: Работа с документами
- [ ] Supabase Storage SDK: загрузка файлов
- [ ] `POST /documents/upload`, `GET /documents`, `DELETE /documents/{id}`
- [ ] Lazy Parser:
  - PDF → `pypdf`
  - DOCX → `python-docx`
  - Кэширование в `Document.extracted_text` (заполняется при первом обращении)
  - Celery task для файлов > 10 MB или если парсинг занимает > 30 сек

### Этап 3: Анализ текста (SpeechDraft)
- [ ] Миграция для `SpeechDraft` + `AIAnalysisResult`
- [ ] `POST /drafts` — создание черновика
- [ ] `POST /drafts/{id}/analyze` — AI-анализ через Gemini с retry (tenacity)
- [ ] Pydantic-схема для валидации ответа Gemini
- [ ] `GET /drafts/{id}/analysis` — получение результата

### Этап 4: Ядро AI Симуляции
- [ ] Миграция для `SimulationSession` + `SimulationMessage` + `SkillMetric`
- [ ] `POST /simulation/start` — создание сессии
- [ ] `POST /simulation/{id}/message`:
  - Сборка контекста (System Instruction + Doc + скользящее окно истории)
  - Вызов Gemini с retry
  - Сохранение в `SimulationMessage` (role, content, internal_reasoning)
- [ ] `GET /simulation/{id}/history`
- [ ] `POST /simulation/{id}/complete` → генерация `SkillMetric`

### Этап 5: Отчёт и Аналитика (MVP+)
- [ ] `GET /simulation/{id}/report` — агрегированный отчёт с метриками
- [ ] Экспорт в PDF (отчёт + улучшенный текст)

---

## 🔒 Безопасность (152-ФЗ)

- Хранение персональных данных: Supabase EU-регион или самостоятельный хостинг на российской инфраструктуре
- Никакой записи аудио или видео — только текст
- Возможность полного удаления профиля: `DELETE /me` удаляет User + все связанные данные + файлы из Storage
- slowapi rate limiting: `/simulation/start` — 10 req/min, `/drafts/analyze` — 20 req/min
- JWT верификация на каждом защищённом эндпоинте

---

## 🚀 Как запустить (dev)

```bash
# 1. Зависимости
pip install -r requirements.txt

# 2. Переменные окружения (.env)
DATABASE_URL=postgresql+asyncpg://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=...
SUPABASE_JWT_SECRET=...   # из Supabase Dashboard → Settings → API
GEMINI_API_KEY=...
REDIS_URL=redis://localhost:6379

# 3. Миграции
alembic upgrade head

# 4. Сервер
uvicorn app.main:app --reload

# 5. Celery worker (опционально на dev)
celery -A app.worker worker --loglevel=info
```

---

## 📁 Структура проекта

```
backend/
├── app/
│   ├── main.py
│   ├── config.py           # Pydantic Settings
│   ├── database.py         # SQLAlchemy async engine
│   ├── dependencies.py     # get_current_user и др.
│   ├── models/             # SQLAlchemy ORM модели
│   ├── schemas/            # Pydantic request/response схемы
│   ├── routers/            # FastAPI роутеры по доменам
│   │   ├── documents.py
│   │   ├── drafts.py
│   │   ├── simulation.py
│   │   └── users.py
│   ├── services/           # Бизнес-логика
│   │   ├── gemini.py       # Gemini SDK + retry
│   │   ├── parser.py       # Lazy Parser (pypdf, python-docx)
│   │   └── storage.py      # Supabase Storage SDK
│   └── worker.py           # Celery tasks
├── alembic/
├── tests/
│   ├── test_documents.py
│   ├── test_simulation.py
│   └── conftest.py         # pytest fixtures
├── requirements.txt
└── .env.example
```
