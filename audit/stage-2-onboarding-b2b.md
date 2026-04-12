# Этап 2 — Onboarding: перестройка под B2B ICP

## Цель
Заменить сегменты и цели в onboarding-флоу на варианты, соответствующие B2B-позиционированию продукта (managers, heads of function, founders, customer-facing teams).

## Контекст
Текущие сегменты включают «Студент» и «Молодой специалист», а цели — «Собеседование» и «Конференция / Доклад». Это противоречит concept.md: «не ориентирован на массовый B2C-рынок и не строится вокруг студентов».

---

## Задачи

### 2.1 Заменить массив SEGMENTS

**Файл:** `frontend/src/app/onboarding/page.tsx`, строки ~14–19

**Текущее:**
```ts
{ id: 'student', label: 'Студент', desc: 'Защита диплома, учебные конференции, стажировки', icon: <GraduationCap /> },
{ id: 'junior', label: 'Молодой специалист', desc: 'Собеседования, онбординг, технические презентации', icon: <FileText /> },
{ id: 'founder', label: 'Фаундер / Стартап', desc: 'Спичи инвесторам, ускорители, демо-дни', icon: <Rocket /> },
{ id: 'manager', label: 'Руководитель', desc: 'Доклады, переговоры, мотивационные выступления', icon: <Users /> },
{ id: 'other', label: 'Другое', desc: 'Любой другой тип коммуникации', icon: <Globe /> },
```

**Замена:**
```ts
{ id: 'manager', label: 'Тимлид / Менеджер', desc: 'Защита решений, приоритизация, апдейты руководству', icon: <Users /> },
{ id: 'head', label: 'Руководитель функции', desc: 'Бюджетные защиты, согласование инициатив, board review', icon: <Briefcase /> },
{ id: 'founder', label: 'Фаундер / CEO', desc: 'Инвест-спичи, партнёрские переговоры, стратегические продажи', icon: <Rocket /> },
{ id: 'customer_facing', label: 'Клиентская команда', desc: 'QBR, эскалации, переговоры по продлению контракта', icon: <MessageSquare /> },
{ id: 'other', label: 'Другое', desc: 'Любой другой тип рабочей коммуникации', icon: <Globe /> },
```

**Импорт иконок** — добавить `Briefcase`, `MessageSquare` в импорт из `lucide-react` (если не импортированы). Убрать `GraduationCap` если больше нигде не используется.

### 2.2 Заменить массив GOALS

**Файл:** `frontend/src/app/onboarding/page.tsx`, строки ~22–28

**Текущее:**
```ts
{ id: 'interview', label: 'Собеседование', icon: <Briefcase /> },
{ id: 'pitch', label: 'Спич инвестору', icon: <Rocket /> },
{ id: 'conference', label: 'Конференция / Доклад', icon: <Mic /> },
{ id: 'defense', label: 'Защита проекта', icon: <MonitorPlay /> },
{ id: 'other', label: 'Другое', icon: <Globe /> },
```

**Замена:**
```ts
{ id: 'budget_defense', label: 'Защита бюджета / roadmap', icon: <FileText /> },
{ id: 'pitch', label: 'Инвест-спич / продажа', icon: <Rocket /> },
{ id: 'qbr', label: 'QBR / клиентский review', icon: <BarChart2 /> },
{ id: 'stakeholder', label: 'Сложный разговор со стейкхолдером', icon: <Users /> },
{ id: 'other', label: 'Другое', icon: <Globe /> },
```

**Импорт:** добавить `BarChart2` если не импортирован.

### 2.3 Обновить типы

**Файл:** `frontend/src/app/onboarding/page.tsx`, строки ~11–12

```ts
// Текущее:
type Segment = 'student' | 'junior' | 'founder' | 'manager' | 'other';
type Goal = 'interview' | 'pitch' | 'conference' | 'defense' | 'other';

// Замена:
type Segment = 'manager' | 'head' | 'founder' | 'customer_facing' | 'other';
type Goal = 'budget_defense' | 'pitch' | 'qbr' | 'stakeholder' | 'other';
```

### 2.4 Обновить заголовки шагов

**Файл:** `frontend/src/app/onboarding/page.tsx`, строки ~122–129

Шаг 1 заголовок: `"Расскажите о себе"` → `"Ваша роль"` (короче, деловитее)
Шаг 1 подзаголовок: `"Это поможет AI-тренеру подобрать правильный стиль и уровень сложности."` → `"Это поможет симулятору подобрать релевантные персоны и стиль давления."`

Шаг 2 заголовок: `"К чему готовитесь?"` → `"Какой тип встречи впереди?"`
Шаг 2 подзаголовок: `"Укажите главную цель — тренер сфокусируется именно на ней."` → `"Выберите ближайший сценарий — симулятор настроит вопросы под него."`

### 2.5 Обновить SEGMENT_LABELS и GOAL_LABELS в settings

**Файл:** `frontend/src/app/(dashboard)/settings/page.tsx`, строки ~23–37

```ts
// SEGMENT_LABELS — заменить на:
const SEGMENT_LABELS: Record<string, string> = {
  manager: 'Тимлид / Менеджер',
  head: 'Руководитель функции',
  founder: 'Фаундер / CEO',
  customer_facing: 'Клиентская команда',
  other: 'Другое',
};

// GOAL_LABELS — заменить на:
const GOAL_LABELS: Record<string, string> = {
  budget_defense: 'Защита бюджета / roadmap',
  pitch: 'Инвест-спич / продажа',
  qbr: 'QBR / клиентский review',
  stakeholder: 'Сложный разговор со стейкхолдером',
  other: 'Другое',
};
```

### 2.6 Проверить backend-совместимость

Бэкенд сохраняет `segment` и `primary_goal` как строки в PostgreSQL. Новые значения (`head`, `customer_facing`, `budget_defense`, `qbr`, `stakeholder`) просто будут записаны как есть — **миграция БД не нужна**. Старые данные (если есть пользователи с `student`/`junior`) останутся и корректно отобразятся через fallback `?? onboardingProfile.segment`.

---

## Порядок выполнения
1. Обновить типы (2.3)
2. Заменить массивы SEGMENTS и GOALS (2.1, 2.2)
3. Обновить заголовки (2.4)
4. Обновить labels в settings (2.5)
5. Подчистить импорты иконок
6. Визуально проверить onboarding flow и settings profile

## Риски
- Существующие пользователи со старыми segment/goal значениями увидят raw-значения (`student` вместо label). Это приемлемо — таких пользователей мало, и settings показывает fallback.
