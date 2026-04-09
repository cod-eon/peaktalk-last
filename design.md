# PeakTalk — Design & Product Architecture

## 1. Product Summary

- **Что строится:** B2B AI-тренажер сложных рабочих коммуникаций.
- **Зачем:** помогать командам заранее отрабатывать жёсткие вопросы и защищать решения увереннее.
- **Для кого:** managers, leads, founders, customer-facing roles.
- **Ограничение MVP:** только текст, без аудио/видео и без биометрии.
- **Не-цели:** не делаем массовый speech-coaching и не строим consumer-продукт “для сцены”.

## 2. Product Principles

- **Pressure over polish:** главная ценность в стресс-тесте аргументации, а не в косметической редактуре.
- **Business context first:** продукт должен говорить языком рабочих сценариев, а не общей “ораторской уверенности”.
- **Low-friction workflow:** загрузил документ, запустил симуляцию, получил конкретный разбор.
- **Serious tone:** без инфантильной геймификации и “AI buddy” вайба.

## 3. Current UX Logic

### Main entities

- **Documents** — исходный материал: стратегия, апдейт, pitch deck text, письмо, memo.
- **Drafts** — рабочие версии текста с AI-анализом.
- **Simulations** — тренировочные Q&A-сессии с persona-based pressure.
- **Billing** — ограничения и платные уровни доступа.

### Core flow

1. Загружает документ или вставляет текст.
2. При необходимости делает draft и запускает AI-анализ.
3. Запускает симуляцию с нужной персоной и уровнем давления.
5. Получает историю, skill metrics и понимание слабых мест.

## 4. UX Direction

### Tone

Интерфейс должен ощущаться как рабочий инструмент для серьёзной подготовки, а не как consumer-приложение для вдохновения.

Подходящий вайб:

- executive clarity;
- controlled tension;
- premium but not flashy;
- analytical, not playful.

### Visual language

- тёмная рабочая палитра;
- высокая контрастность;
- чистые карточки и ясная иерархия;
- restrained motion;
- акценты только там, где нужна навигация или сигнал статуса.

### Good metaphors

- war room;
- prep room;
- simulation lab;
- decision defense workspace.

### Bad metaphors

- сцена;
- аплодисменты;
- “прокачай уверенность”;
- student/exam aesthetics.

## 5. Landing Direction

Лендинг и верхнеуровневый narrative должны продавать не “ораторское мастерство”, а конкретный бизнес-результат.

### Hero

Правильный смысл:

- защити решение до реальной встречи;
- потренируйся на жёстких вопросах заранее;
- вскрой слабые места аргументации до того, как это сделает руководитель, клиент или инвестор.

### Key sections

1. **Problem framing**
   Потери от слабой аргументации в high-stakes разговорах.

2. **How it works**
   Document → analysis → simulation → evaluation.

3. **Use cases**
   Budget defense, QBR, investor pitch, internal strategy review, escalation call.

4. **Personas**
   Investor, skeptical executive, tough client, demanding manager, critical partner.

5. **Team / pricing**
   Не freemium для широкой массы, а B2B-friendly access model.

## 6. Technical Shape Of The Product

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind, Framer Motion, Zustand, TanStack Query
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL
- **AI:** Gemini for draft analysis, question generation, skill evaluation
- **Storage:** Supabase Storage for uploaded files
- **Business layer:** usage limits, subscription plans, YooKassa

## 7. Product Risks

- Размывание позиционирования в “AI coach for public speaking”.
- Смешение B2B use cases с consumer/student narratives.
- Слишком широкий ICP без одного ясного wedge.
- Избыточное обещание “коучинга”, если продукт реально силён именно в simulation + pressure testing.

## 8. Current Strategic Conclusion

Самая сильная версия PeakTalk сегодня:

**B2B AI simulation workspace for difficult business conversations and decision defense.**

Это точнее соответствует и реальному коду, и платежной логике, и типам персон, и общей архитектуре продукта.
