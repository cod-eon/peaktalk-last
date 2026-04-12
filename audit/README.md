# PeakTalk — Аудит сайта: Технические планы

Дата аудита: 2026-04-09

## Этапы

| # | Файл | Область | Сложность | Зависимости |
|---|------|---------|-----------|-------------|
| 1 | [stage-1-landing-tone.md](stage-1-landing-tone.md) | Лендинг: тон «вы», дублирование секций, badge | Низкая | — |
| 2 | [stage-2-onboarding-b2b.md](stage-2-onboarding-b2b.md) | Onboarding: сегменты/цели под B2B ICP | Средняя | — |
| 3 | [stage-3-settings-ux.md](stage-3-settings-ux.md) | Settings: формулировки, убрать дубль «Биллинг» | Низкая | — |
| 4 | [stage-4-landing-structure.md](stage-4-landing-structure.md) | Лендинг: финальный порядок секций | Низкая | Этап 1 |
| 5 | [stage-5-polish.md](stage-5-polish.md) | Confetti, тексты, мелкие правки | Низкая | Этап 2 |
| 6 | [stage-6-drafts-visibility.md](stage-6-drafts-visibility.md) | Баг: черновики не видны на /documents | Средняя | — |

## Параллельность
- Этапы 1, 2, 3, 6 — независимы, можно выполнять параллельно
- Этап 4 — после Этапа 1
- Этап 5 — после Этапа 2

## Что удалено из концепции
- `Projects` (группировка документов и симуляций) — убрано из concept.md, design.md, CLAUDE.md
