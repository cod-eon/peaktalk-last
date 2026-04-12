# Этап 4 — Структура лендинга: финальный порядок секций

## Цель
После удаления SocialProofStrip и ProblemAgitation (Этап 1), убедиться что оставшиеся секции выстроены в логичную продающую последовательность.

## Контекст
После Этапа 1 порядок секций станет:
```
Nav → Hero → ActionFlow → ImpactEvidence → ComparisonBlock → Testimonials → PricingBlock → FooterCTA
```

---

## Задачи

### 4.1 Проверить и утвердить порядок секций

Финальный порядок (после Этапа 1):

1. **Hero** — заголовок + визуал продукта + CTA
2. **ActionFlow** (`#how`) — «Как это работает» в 3 шага с мокапами
3. **ImpactEvidence** (`#value`) — тёмная секция «Почему это работает лучше» (3 карточки)
4. **ComparisonBlock** (`#comparison`) — PeakTalk vs. 3 альтернативы
5. **Testimonials** — отзывы/кейсы
6. **PricingBlock** (`#pricing`) — тарифы
7. **FooterCTA** — финальный CTA + footer

**Файл:** `frontend/src/app/page.tsx`, компонент `Page()` (~строка 1280)

Итоговый JSX:
```tsx
<main className="relative min-h-screen selection:bg-[#E8600A] selection:text-white">
  <Nav />
  <Hero />
  <ActionFlow />
  <ImpactEvidence />
  <ComparisonBlock />
  <Testimonials />
  <PricingBlock />
  <FooterCTA />
</main>
```

### 4.2 Обновить навигацию лендинга

После удаления ProblemAgitation якоря остаются корректными (`#how`, `#comparison`, `#pricing`). Проверить, что в Nav и Mobile menu ссылки работают:

**Файл:** `frontend/src/app/page.tsx`, компонент `Nav()`, строки ~223–226 и ~328–331

Текущие пункты:
```ts
{ label: 'Как работает', id: '#how' },
{ label: 'Сравнение', id: '#comparison' },
{ label: 'Цены', id: '#pricing' },
```

Оставить без изменений — все якоря (`id="how"`, `id="comparison"`, `id="pricing"`) присутствуют в оставшихся секциях.

### 4.3 Подзаголовок ActionFlow — тон

**Файл:** `frontend/src/app/page.tsx`, строка ~753

```
Текущее: "Три шага до уверенного выступления."
Замена:  "Три шага до уверенной защиты."
```

«Выступление» звучит consumer-но (сцена, аудитория). «Защита» — точнее по B2B-контексту.

---

## Порядок выполнения
1. Убедиться что после Этапа 1 порядок секций соответствует 4.1
2. Проверить якоря навигации (4.2)
3. Заменить подзаголовок (4.3)

## Риски
- Нет рисков. Этап зависит от завершения Этапа 1.
