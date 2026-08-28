# 0005 — Поддержка legacy DOC

Status: accepted

Date: 2026-08-09

## Решение

PeakTalk MVP поддерживает старый бинарный формат `.doc` наряду с PDF, DOCX,
TXT и MD. Для извлечения plain text API и Celery worker используют системный
`antiword`, установленный в обоих production images.

Разбор выполняется без shell, с ограничением 30 секунд. Повреждённый файл,
отсутствующая runtime-зависимость или превышение timeout дают понятную ошибку;
пользователю предлагается сохранить файл как DOCX.

## Почему

- `.doc` уже заявлен в UI и allowlist upload API.
- `python-docx` не поддерживает legacy binary DOC.
- `antiword` закрывает узкий MVP-кейс без тяжёлой миграции и без нового
  пользовательского workflow.

## Ограничения

- В MVP извлекается текст, а не полное форматирование.
- Embedded objects, макросы, tracked changes и сложная вёрстка не являются
  частью результата анализа.
- Если production image не содержит `antiword`, DOC не считается успешно
  поддержанным; doctor/deploy должны выявить такую ошибку на этапе сборки.

## Acceptance criteria

- `.doc` не передаётся в `python-docx`.
- API image и worker image содержат `antiword`.
- Есть automated coverage для маршрутизации legacy DOC и отсутствующей
  зависимости.
- DOCX path остаётся отдельным и не изменяется.
