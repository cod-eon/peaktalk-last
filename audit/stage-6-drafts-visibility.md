# Этап 6 — Баг: черновики (drafts) не видны на странице /documents

## Проблема
Пользователь создаёт черновик и получает AI-анализ. Но на странице `/documents` (Мои тексты) нет явного отображения черновиков:

1. **Standalone-черновики** (draft без document_id) — вообще не показываются нигде в UI
2. **Черновики, привязанные к документу** — показываются только как ссылка «Разбор →», без статуса «Проанализирован»

## Корневая причина

### Backend
- `GET /documents` возвращает только документы (`Document` модель), подтягивая `draft_id` из `SpeechDraft`
- `GET /drafts` возвращает все черновики (с analysis_result) — **endpoint работает**, но фронтенд его не вызывает на странице documents

### Frontend
- `frontend/src/app/(dashboard)/documents/page.tsx` делает запрос только к `/documents`
- Нет запроса к `/drafts` для standalone-черновиков
- Нет визуального индикатора статуса анализа в таблице

### Модель данных
```
Document (может не иметь draft)
  └── SpeechDraft (document_id nullable)
        └── AIAnalysisResult (1:1 с draft)
```

---

## Решение

### 6.1 Добавить визуальный индикатор «Проанализирован» для документов

**Файл:** `frontend/src/app/(dashboard)/documents/page.tsx`

В таблице документов, для каждого документа у которого `doc.draft_id !== null`, показать badge/иконку рядом с именем:

```tsx
{doc.draft_id && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-none ml-2">
    Проанализирован
  </span>
)}
```

Место вставки — после `<span>` с `doc.name` в обоих layout-ах (mobile и desktop), строки ~211–212 и ~246–248.

### 6.2 Показать standalone-черновики в списке

Есть два подхода:

**Подход A (рекомендуемый): Расширить backend endpoint `/documents`**

Добавить в ответ `/documents` standalone-черновики как «виртуальные документы» с `source: 'draft'`. Это позволит показывать всё в одном списке.

**Файл:** `backend/app/routers/documents.py`, в функции `list_documents()`

После основного запроса документов, добавить запрос standalone-черновиков:

```python
# After fetching docs, also fetch standalone drafts (no document_id)
standalone_result = await db.execute(
    select(SpeechDraft)
    .where(
        SpeechDraft.user_id == current_user.id,
        SpeechDraft.document_id.is_(None),
    )
    .order_by(SpeechDraft.created_at.desc())
)
standalone_drafts = list(standalone_result.scalars().all())

# Convert standalone drafts to DocumentResponse-like items
for sd in standalone_drafts:
    items.append(DocumentResponse(
        id=sd.id,
        name=sd.title,
        file_type="text",
        storage_path=None,
        source="draft",
        extracted_text=None,
        parsed_at=None,
        created_at=sd.created_at,
        draft_id=sd.id,
    ))

# Update total
total += len(standalone_drafts)
```

**Обновить DocumentResponse schema** — добавить `source: 'draft'` как допустимое значение (если есть валидация).

**Подход B (альтернативный): Отдельная секция «Черновики» на фронтенде**

Сделать второй запрос к `GET /drafts` и показать standalone-черновики в отдельном блоке под таблицей документов.

### 6.3 Обновить фильтры

**Файл:** `frontend/src/app/(dashboard)/documents/page.tsx`, строки ~24, ~77–80

Если реализован подход A, добавить фильтр для черновиков:

```ts
const FILTERS = ['Все', 'Файлы', 'Тексты', 'Черновики'] as const;
```

И в filtered:
```ts
activeFilter === 'Черновики' ? doc.source === 'draft' :
```

### 6.4 Ссылка «Разбор» для standalone-черновиков

Для standalone-черновиков `doc.draft_id === doc.id` (т.к. сам ID = draft ID). Текущая логика:
```tsx
href={doc.draft_id ? `/analysis/${doc.draft_id}` : `/upload`}
```
Это уже корректно работает — ссылка будет вести на `/analysis/{draft_id}`.

---

## Порядок выполнения
1. Backend: расширить `/documents` для standalone-черновиков (6.2)
2. Frontend: добавить badge «Проанализирован» (6.1)
3. Frontend: обновить фильтры (6.3)
4. Тестировать: создать standalone-черновик → проверить видимость на /documents

## Риски
- Подход A меняет контракт API — но `source: 'draft'` добавляется как новое значение, не ломая существующие.
- Пагинация: standalone-черновики добавляются после пагинации документов. Для MVP это приемлемо, но при масштабировании нужен unified query.

## Альтернатива (если не хочется трогать backend)
Фронтенд может сам сделать параллельный запрос к `GET /drafts` и объединить результаты в UI. Недостаток — двойной запрос и дублирование логики.
