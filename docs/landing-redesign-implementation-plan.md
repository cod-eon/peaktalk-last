# PeakTalk: План реализации редизайна лендинга

## 1. Обзор и ссылки
Этот документ является техническим планом реализации редизайна главной страницы. Он строго следует продуктовым и визуальным решениям, утвержденным в спецификации:
**Спецификация:** [docs/landing-redesign-spec.md](landing-redesign-spec.md)

**Целевой файл:** `frontend/src/app/page.tsx`
**Ресурсы:** `frontend/public/illustrations/*.svg`

---

## 2. Фаза 1: Компонент `InteractiveScenarios` (Замена старого `Scenarios`)

### 2.1. Обновление структуры данных
Мы создаем массив сценариев с явным указанием путей к новым SVG:
```typescript
const scenarios = [
  {
    tag: 'Бюджет',
    title: 'Защитить бюджет перед руководителем',
    desc: 'Когда просят сократить расходы, а Вам нужно доказать, что решение влияет на результат.',
    href: '/scenarios/budget-cut-q3',
    svg: '/illustrations/cfo-negotiation.svg'
  },
  {
    tag: 'Клиент',
    title: 'Подготовиться к разговору с клиентом',
    desc: 'Когда нужно вернуть доверие, объяснить сбой или защитить продление контракта.',
    href: '/scenarios/client-escalation',
    svg: '/illustrations/client-meeting.svg'
  },
  {
    tag: 'Инвестор',
    title: 'Выдержать вопросы инвестора',
    desc: 'Когда будут давить на рынок, рост, unit-экономику и реалистичность плана.',
    href: '/scenarios/series-a-pitch',
    svg: '/illustrations/investor-pitch.svg'
  }
  // 4-й сценарий "Инициатива" можно оставить без картинки или переиспользовать наиболее подходящую (например, cfo)
];
```

### 2.2. Состояние и базовая сетка
- Добавляем хук: `const [activeIndex, setActiveIndex] = useState(0);`
- **Десктоп:** `className="grid lg:grid-cols-[320px_1fr] border border-neutral-300"`
- **Мобилка:** На мобильных устройствах это будет `flex flex-col`, где табы сценариев можно скроллить по горизонтали (`overflow-x-auto`).

### 2.3. Левая колонка (Навигация)
- Рендерится список кнопок для выбора сценария.
- **Анимация активного стейта:** Используем `layoutId` из `framer-motion` для плавно перетекающей оранжевой линии слева.
  ```tsx
  {activeIndex === index && (
    <motion.div layoutId="scenarioTabIndicator" className="absolute left-0 top-0 bottom-0 w-1 bg-[#E8600A]" />
  )}
  ```

### 2.4. Правая колонка (Витрина сценария)
- Фон: `bg-[#faf8f4]`.
- Плавная смена SVG-иллюстрации через `AnimatePresence`:
  ```tsx
  <AnimatePresence mode="wait">
    <motion.div
      key={activeIndex}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      className="relative flex h-[300px] w-full items-center justify-center"
    >
      <Image src={scenarios[activeIndex].svg} fill className="object-contain" alt={scenarios[activeIndex].title} priority />
    </motion.div>
  </AnimatePresence>
  ```
- Ниже (или поверх) размещается CTA-кнопка "Разобрать этот сценарий".

---

## 3. Фаза 2: Компонент `ActionFlowPipeline` (Замена старого `ActionFlow`)

### 3.1. Точный копирайт и структура шагов (Утверждено)
```typescript
const steps = [
  {
    id: '01',
    title: 'Загрузите спич',
    body: 'Тезисы, документ, коммерческое предложение, письмо клиенту, план защиты бюджета или структура презентации.',
    result: 'готовый сценарий тренировки',
    svg: '/illustrations/upload-document.svg'
  },
  {
    id: '02',
    title: 'Пройдите симуляцию',
    body: 'Ответьте на 3 неудобных вопроса. Оппонент проверит приоритеты, ценность и надавит на риски.',
    result: 'проверенная аргументация',
    svg: '/illustrations/ai-chat.svg'
  },
  {
    id: '03',
    title: 'Получите план улучшений',
    body: 'Полный разбор: аргументы, риски, возражения, формулировки и ваш следующий рабочий шаг.',
    result: 'список правок',
    svg: '/illustrations/report-checklist.svg'
  }
];
```

### 3.2. Макет и идеальные границы (1px Borders)
- Чтобы избежать двойных границ между карточками на десктопе, используем трюк с `gap-px`:
  `className="grid md:grid-cols-3 gap-px bg-neutral-200 border border-neutral-300"`
- Сами карточки имеют белый фон, поэтому щели работают как однопиксельные рамки.

### 3.3. Внутренняя структура карточки
- **Верх (Визуал):** `className="bg-[#faf8f4] h-[260px] flex flex-col items-center justify-end overflow-hidden group"`
  - Иллюстрация приподнимается при ховере: `className="transition-transform duration-400 group-hover:-translate-y-2"`
- **Низ (Текст):** `className="bg-white p-6 md:p-8 flex flex-col"`
  - **Номер:** `01`
  - **Заголовок:** "Загрузите спич"
  - **Описание:** `body` из массива (серое, легко читаемое).
  - **Результат:** `className="mt-6 pt-5 border-t border-neutral-100 text-sm font-semibold text-[#E8600A]"` -> "Результат: готовый сценарий тренировки".

### 3.4. Индикация движения (Arrows & Timeline)
- **Десктоп (Стрелки перехода):**
  - Абсолютно позиционированные тонкие стрелки (через `lucide-react` или SVG), которые визуально накладываются на вертикальные стыки между карточками (между шагом 1 и 2, и между 2 и 3).
- **Мобильная версия (Вертикальный Timeline):**
  - Сетка `grid-cols-3` отключается, включается `flex flex-col relative`.
  - Рисуем вертикальную линию слева через `before:absolute before:left-8 before:top-0 before:bottom-0 before:w-px before:bg-neutral-300`.
  - Каждый шаг выглядит как узел (node) на этой временной шкале.

---

## 4. Фаза 3: Интеграция и QA
1. Интегрировать `InteractiveScenarios` и `ActionFlowPipeline` в `frontend/src/app/page.tsx`, заменив старый код.
2. Проверить тайпинги: `npx tsc --noEmit`.
3. Линтинг: `npx eslint ./frontend/src/app/page.tsx --max-warnings=0`.
4. Запустить локальный сервер и удостовериться:
   - В отсутствии CLS (Cumulative Layout Shift) при смене SVG.
   - В идеальном отображении вертикального таймлайна на мобильных.
   - Что все 3 новые иллюстрации и тексты точно соответствуют этому плану.
