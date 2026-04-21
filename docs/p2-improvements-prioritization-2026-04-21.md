# PeakTalk — P2 Улучшения: Приоритетизация 2026-04-21

**Статус:** Готов к реализации
**Следующие:** Browser flow checklist → реализация P2

---

## Приоритет P2-1 (сделать первым): Shared Date Utils

**Проблема:** Форматирование даты разбросано по всем экранам

**Файлы для изменения:**
- `frontend/src/app/(dashboard)/meetings/page.tsx` (строки 100-114)
- `frontend/src/app/(dashboard)/dashboard/page.tsx` (использует getPersonaDisplayLabel, но formatDate в компонентах)
- `frontend/src/app/(dashboard)/progress/page.tsx` (строки 64-69)
- `frontend/src/app/(dashboard)/documents/page.tsx` (строки 230)
- `frontend/src/app/(dashboard)/personas/page.tsx` (может быть)
- `frontend/src/app/(dashboard)/simulation/[id]/report/page.tsx` (строки ~120 для completion_at)
- `frontend/src/app/(dashboard)/billing/page.tsx` (строки 244-249, 676)

**Что создать:**
```typescript
// frontend/src/lib/date.ts
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
```

**Что заменить:** Все локальные функции `formatDate`, `formatTime`, `formatDatetime` импортом из `@/lib/date`.

---

## Приоритет P2-2: Shared Difficulty Color

**Проблема:** Логика сложности дублируется на dashboard и personas страницах

**Что создать:**
```typescript
// frontend/src/lib/constants/personas.ts (добавить к существующему)
export function getDifficultyColor(difficulty: number): string {
  if (difficulty <= 2) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (difficulty === 3) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
}
```

**Файлы для изменения:**
- `frontend/src/app/(dashboard)/personas/page.tsx` (строки 81-85, 343)
- `frontend/src/lib/constants/personas.ts` (добавить функцию)

---

## Приоритет P2-3: Upgrade Logic Extraction

**Проблема:** Условия апгрейда захардкожжены в billing/page.tsx (строки 556-564)

**Что создать:**
```typescript
// frontend/src/lib/billing-upgrade.ts
export type PlanTier = 'free' | 'per_session' | 'personal' | 'pro' | 'team';

export function canUpgradeToPlan(
  currentPlan: PlanTier,
  targetPlan: PlanTier,
  paymentsEnabled: boolean
): boolean {
  // Условия для каждого плана
  if (!paymentsEnabled) return false;
  
  const tiers: PlanTier[] = ['free', 'per_session', 'personal', 'pro', 'team'];
  const currentIdx = tiers.indexOf(currentPlan);
  const targetIdx = tiers.indexOf(targetPlan);
  
  if (targetIdx <= currentIdx) return false; // Нельзя даунгрейдиться
  if (currentPlan === 'free') return true; // С Free можно куда угодно
  if (currentPlan === 'per_session' && targetIdx > 1) return false; // С per_session только на personal
  if (currentPlan === 'personal' && targetIdx > 2) return false; // С personal только на pro
  
  return true;
}

export function getCurrentPlan(status?: { subscription?: { plan: string } }): PlanTier {
  return (status?.subscription?.plan as PlanTier) ?? 'free';
}
```

**Файлы для изменения:**
- `frontend/src/app/(dashboard)/billing/page.tsx` (строки 556-564 → использовать `canUpgradeToPlan`)

---

## Приоритет P2-4: ConfirmDialog Standardization

**Проблема:** Meetings использует `window.confirm()` вместо стандартного диалога

**Что использовать:** Уже есть `@/components/ConfirmDialog` из personas страницы

**Файлы для изменения:**
- `frontend/src/app/(dashboard)/meetings/page.tsx` (строки 544, заменить confirm)

---

## Приоритет P2-5: Shared Card Component

**Проблема:** Карточки (meetings, documents, personas) используют разную HTML структуру

**Когда делать:** После P2-1 (когда будет shared lib, удобнее добавить туда)

**Компонент для создания:**
```typescript
// frontend/src/components/shared/Card.tsx
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className, onClick, hover }: CardProps) {
  return (
    <div className={`
      bg-white rounded-none border p-4 sm:p-5
      ${hover ? 'hover:border-neutral-400 hover:bg-neutral-50' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}
```

---

## Приоритет P2-6: Error Boundary

**Проблема:** Несогласованная обработка ошибок по экранам

**Что создать:**
```typescript
// frontend/src/components/ErrorBoundary.tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-neutral-50">
          <div className="bg-white border border-neutral-200 rounded-none p-8 text-center max-w-md">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              Что-то пошло не так
            </h2>
            <p className="text-sm text-neutral-500 mb-6">
              Произошла ошибка. Попробуйте обновить страницу.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-neutral-900 text-white px-6 py-3 rounded-none font-medium hover:bg-neutral-800"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Где использовать:** Обернуть все `(dashboard)` layout или отдельные страницы.

---

## Порядок реализации

1. ✅ **Phase 0:** Data reset — выполнено
2. ✅ **Phase 1-4:** Backend, setup, meetings, report — выполнено
3. ✅ **Phase 5.1:** Dashboard audit — выполнено
4. 🔄 **Phase 5.2:** Browser flow checklist — готов к проходению
5. ⏳ **Phase 5.3:** P2 улучшения — начнаем с Date Utils

---

**Документы:**
- Executive summary: `/docs/dashboard-audit-executive-summary-2026-04-21.md`
- Detailed breakdown: `/docs/dashboard-audit-detailed-2026-04-21.md`
- Browser flow checklist: `/docs/browser-flow-checklist-2026-04-21.md`
- P2 improvements: `/docs/p2-improvements-prioritization-2026-04-21.md` (этот файл)

---

**Статус:** Dashboard audit завершен. P2 улучшения приоритизованы. Ready для реализации или browser flow testing.
