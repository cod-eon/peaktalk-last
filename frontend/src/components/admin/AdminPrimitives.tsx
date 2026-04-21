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
  eyebrow: string;
  title: string;
  description: string;
  index: string;
  actions?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border border-black/10 bg-white/86 shadow-[0_24px_80px_rgba(17,24,39,0.08)] backdrop-blur">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(232,96,10,0.07),transparent_48%),linear-gradient(90deg,rgba(17,24,39,0.03)_1px,transparent_1px),linear-gradient(rgba(17,24,39,0.03)_1px,transparent_1px)] bg-[length:auto,36px_36px,36px_36px]" />
      <div className="absolute right-4 top-2 text-[84px] font-syne font-bold tracking-[-0.08em] text-black/[0.05] sm:right-8 sm:top-4 sm:text-[120px]">
        {index}
      </div>

      <div className="relative grid gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-neutral-500">
            {eyebrow}
          </p>
          <h1 className="mt-3 max-w-2xl font-syne text-[34px] leading-[0.92] tracking-[-0.05em] text-neutral-950 sm:text-[48px]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-neutral-600">
            {description}
          </p>
        </div>

        {actions ? <div className="relative flex flex-wrap items-center gap-3">{actions}</div> : null}
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
        'relative overflow-hidden border border-black/10 bg-white/92 shadow-[0_18px_60px_rgba(17,24,39,0.06)]',
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(232,96,10,0.3),transparent)]" />
      <div className="relative flex flex-wrap items-start justify-between gap-4 border-b border-black/8 px-5 py-5 sm:px-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-neutral-500">
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
    <article className="relative overflow-hidden border border-black/10 bg-white/90 p-5 shadow-[0_14px_36px_rgba(17,24,39,0.05)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#E8600A,rgba(232,96,10,0.18))]" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-neutral-500">{label}</p>
          <div className="mt-4 text-[30px] font-semibold tracking-[-0.04em] text-neutral-950">{value}</div>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{helper}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center border border-black/10 bg-neutral-950 text-white">
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
        Страница {page} из {pages} · Всего записей: {total}
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
