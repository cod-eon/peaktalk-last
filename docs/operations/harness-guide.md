# Практическая инструкция PeakTalk harness

Harness — рабочий протокол для задач PeakTalk. Он помогает не потерять
контекст, решение и доказательства проверки. Он не заменяет решение
пользователя и не авторизует рискованные изменения автоматически.

## Как ставить задачу

Хорошая задача содержит:

1. ожидаемый результат для пользователя или системы;
2. затронутые пути, если они известны;
3. критерии приёмки;
4. что не входит в задачу;
5. проверки, которые докажут результат.

Пример:

```text
Добавь экспорт Defense Brief в PDF.
Затронь только report UI и backend artifact endpoint.
Приёмка: PDF открывается, кириллица читается, paywall сохраняется.
Не менять Storage/Auth и не добавлять новую модель оплаты.
Проверки: backend tests, frontend build, browser smoke desktop/mobile.
```

Не начинай с «сделай красиво» или «почини всё». Это не критерии и почти
гарантирует расползание scope.

## Что делает агент до работы

Для нетривиальной задачи агент должен вызвать `route_task`. Router определяет
mode, domain, risk, минимальные durable docs, нужные проверки и максимум три
skills. После этого агент читает только возвращённый контекст.

Локальная диагностика:

```bash
node .harness/bin/harness.mjs route "Проверь upload flow" --mode review --path backend/app/routers/documents.py
node .harness/bin/harness.mjs context "upload_document parser extracted_text"
node .harness/bin/harness.mjs codegraph-health
```

Code navigation имеет порядок `MCP → CodeGraph CLI → rg`. Если CodeGraph
недоступен, разработка не останавливается: используется следующий fallback.

## Когда нужен task contract

Contract обязателен для product behavior, multi-file changes, substantial UI,
architecture, Auth, billing, Storage, migrations, deploy и security-sensitive
задач. Для одной очевидной copy/CSS правки без изменения поведения он обычно
не нужен.

Lifecycle:

```text
draft → awaiting-decision → ready → in-progress → verifying → complete
```

Через Codex предпочтительно использовать MCP tools:

```text
start_task → record_decision → begin_task → record_check → complete_task
```

Через CLI те же операции доступны как JSON-команды:

```bash
node .harness/bin/harness.mjs start-task '{"taskId":"brief-export","task":"Добавить PDF export","mode":"implement","paths":["frontend/src/app/(dashboard)/simulation/[id]/report/page.tsx"],"acceptanceCriteria":["PDF открывается"],"nonGoals":["Storage migration"]}'
node .harness/bin/harness.mjs get-task brief-export
node .harness/bin/harness.mjs begin-task brief-export
node .harness/bin/harness.mjs record-check '{"taskId":"brief-export","checkId":"frontend-build","result":"pass","evidence":"next build completed","command":"npm run build --prefix frontend"}'
node .harness/bin/harness.mjs complete-task '{"taskId":"brief-export","summary":"PDF export реализован и проверен"}'
```

`complete-task` отклоняется, если не закрыто durable decision, есть failed
check или отсутствует fresh pass evidence. `skipped` не считается pass.

## Decision gate

Если задача меняет продукт, позиционирование, цену, Auth, Storage, billing,
публичный API или другую дорогую архитектурную границу, агент должен остановить
implementation и показать варианты с trade-offs. После одобрения решение
записывается в `docs/decisions/`, и только затем вызывается `record_decision`.

Chat history не является source of truth. Если решения нет в репозитории, оно
не считается принятым для следующего task.

## Skills

Приоритет выбора:

1. один релевантный PeakTalk project skill;
2. необходимая trusted system guidance;
3. максимум один allowlisted AAS skill.

Всего не больше трёх. AAS — холодный pinned catalog в
`.harness/vendor/aas`; не устанавливай весь каталог в `.codex/skills` и не
запускай его scripts.

Проверить состояние:

```bash
node .harness/bin/harness.mjs status
node .harness/bin/harness.mjs audit
node .harness/bin/harness.mjs search "browser testing"
```

## Проверки и завершение

Перед handoff нужны свежие evidence по required checks. Минимальный baseline:

```bash
npm test --prefix .harness
./backend/.venv/bin/python -m pytest backend
bash .harness/scripts/doctor.sh
git diff --check
```

Для полного release gate:

```bash
bash .harness/scripts/doctor.sh --full
```

Full doctor включает frontend lint/build, dependency audit и Compose validation.
Docker или внешний registry могут быть недоступны локально; это limitation,
а не pass. Не запускай автоматически `npm audit fix --force`.

## Recovery

Если harness или CodeGraph сломан:

```bash
./.harness/scripts/bootstrap.sh
node .harness/bin/harness.mjs codegraph-health
bash .harness/scripts/doctor.sh
```

При проблеме CodeGraph проверь, что регистрация одна: глобальная. Не добавляй
вторую project registration и не убивай процессы вслепую. Runbook:
[harness-recovery.md](harness-recovery.md).

Старый проект `/Users/codeon/peaktalk-last` не является источником правил,
skills или product context.
