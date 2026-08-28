'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AdminPlanId } from '@/types/admin';
import type { PaymentStatus } from '@/types/billing';
import {
  ADMIN_PLAN_META,
  PAYMENT_STATUS_META,
  SUBSCRIPTION_STATUS_META,
} from '@/lib/admin';

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  index,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  index?: string;
  actions?: ReactNode;
}) {
  return (
    <section data-section-index={index}>
      <div className="grid gap-5 py-2 sm:py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-3xl">
          {eyebrow ? <p className="text-xs font-medium text-neutral-500">{eyebrow}</p> : null}
          <h1 className="mt-1 max-w-2xl text-2xl font-semibold leading-tight tracking-[-0.025em] text-neutral-950 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            {description}
          </p>
        </div>

        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

export function AdminPanel({
  title,
  subtitle,
  children,
  aside,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'relative overflow-hidden border border-black/10 bg-white',
        className,
      )}
    >
      <div className="relative flex flex-wrap items-start justify-between gap-4 border-b border-black/8 px-5 py-4 sm:px-6">
        <div>
          <p className="text-sm font-semibold text-neutral-950">
            {title}
          </p>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{subtitle}</p> : null}
        </div>
        {aside}
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

export function AdminMetricCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}) {
  return (
    <article className="relative overflow-hidden border border-black/10 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-neutral-500">{label}</p>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-neutral-950">{value}</div>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{helper}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center border border-black/10 bg-neutral-50 text-neutral-700">
          <Icon size={18} />
        </div>
      </div>
    </article>
  );
}

export function AdminPlanBadge({ plan }: { plan: AdminPlanId }) {
  const meta = ADMIN_PLAN_META[plan] ?? ADMIN_PLAN_META.free;

  return (
    <span className={cn('inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]', meta.className)}>
      {meta.label}
    </span>
  );
}

export function AdminSubscriptionBadge({ status }: { status: string }) {
  const meta = SUBSCRIPTION_STATUS_META[status] ?? {
    label: status,
    className: 'border-neutral-200 bg-neutral-100 text-neutral-600',
  };

  return (
    <span className={cn('inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', meta.className)}>
      {meta.label}
    </span>
  );
}

export function AdminPaymentBadge({ status }: { status: PaymentStatus | string }) {
  const meta = PAYMENT_STATUS_META[status] ?? {
    label: status,
    className: 'border-neutral-200 bg-neutral-100 text-neutral-600',
  };

  return (
    <span className={cn('inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', meta.className)}>
      {meta.label}
    </span>
  );
}

export function AdminEmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center border border-black/10 bg-neutral-100 text-neutral-500">
        <Icon size={22} />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-neutral-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-neutral-600">{description}</p>
    </div>
  );
}

export function AdminErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center" role="alert">
      <p className="text-sm text-red-700">{message}</p>
      <button type="button" onClick={onRetry} className="min-h-10 border border-black/15 bg-white px-4 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]">
        Повторить
      </button>
    </div>
  );
}

export function AdminPagination({
  page,
  pages,
  total,
  onPageChange,
}: {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (pages <= 1) return null;

  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const buttons = Array.from({ length: Math.min(5, pages) }, (_, index) => start + index).filter(
    (value) => value <= pages,
  );

  return (
    <div className="flex flex-col gap-4 border-t border-black/8 bg-[rgba(17,24,39,0.02)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-sm text-neutral-600">
        Страница {page} из {pages}. Всего записей: {total}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="inline-flex h-10 w-10 items-center justify-center border border-black/10 bg-white text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Предыдущая страница"
        >
          <ChevronLeft size={16} />
        </button>

        {buttons.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onPageChange(value)}
            className={cn(
              'inline-flex h-10 min-w-10 items-center justify-center border px-3 text-sm font-semibold transition-colors',
              value === page
                ? 'border-neutral-950 bg-neutral-950 text-white'
                : 'border-black/10 bg-white text-neutral-700 hover:bg-neutral-100',
            )}
          >
            {value}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          className="inline-flex h-10 w-10 items-center justify-center border border-black/10 bg-white text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Следующая страница"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
