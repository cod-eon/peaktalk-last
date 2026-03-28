'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  TrendingUp,
  Copy,
  Check,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { AdminPaymentsResponse, AdminPayment } from '@/types/admin';
import type { PaymentStatus } from '@/types/billing';

// ─── Payment status badge ─────────────────────────────────────────────────────

function PaymentStatusBadge({ status }: { status: PaymentStatus | string }) {
  switch (status) {
    case 'succeeded':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          Оплачен
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
          Ожидание
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-50 text-red-600 border border-red-200">
          Ошибка
        </span>
      );
    case 'refunded':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
          Возврат
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--bg-surface-alt)] text-[var(--text-dim)] border border-[var(--border-main)]">
          Отменён
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--bg-surface-alt)] text-[var(--text-dim)] border border-[var(--border-main)]">
          {status}
        </span>
      );
  }
}

// ─── YooKassa ID cell with copy ───────────────────────────────────────────────

function YookassaIdCell({ id }: { id: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!id) return <span className="text-[var(--text-dim)]">—</span>;

  const shortId = id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-[12px] font-mono text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors group cursor-pointer"
      title={id}
    >
      <span>{shortId}</span>
      {copied ? (
        <Check size={11} className="text-emerald-500 shrink-0" />
      ) : (
        <Copy size={11} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

// ─── Plan label ───────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'PRO',
  team: 'TEAM',
};

// ─── Summary stats bar ────────────────────────────────────────────────────────

function PaymentsSummary({ payments }: { payments: AdminPayment[] }) {
  const succeeded = payments.filter((p) => p.status === 'succeeded');
  const total = succeeded.reduce((sum, p) => sum + p.amount, 0);
  const pending = payments.filter((p) => p.status === 'pending').length;
  const failed = payments.filter((p) => p.status === 'failed').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {[
        { label: 'Успешных', value: succeeded.length, cls: 'text-emerald-600' },
        {
          label: 'На сумму',
          value: `${total.toLocaleString('ru-RU')} ₽`,
          cls: 'text-[var(--accent-primary)]',
        },
        { label: 'Ожидают', value: pending, cls: 'text-amber-600' },
        { label: 'Ошибок', value: failed, cls: 'text-red-500' },
      ].map((stat) => (
        <div
          key={stat.label}
          className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-main)] px-4 py-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)] mb-1">
            {stat.label}
          </p>
          <p className={`text-[20px] font-bold ${stat.cls}`} style={{ fontFamily: 'var(--font-syne)' }}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery<AdminPaymentsResponse>({
    queryKey: ['admin-payments', page],
    queryFn: () => api.get(`/admin/payments?page=${page}&per_page=20`),
    staleTime: 30_000,
    retry: 1,
  });

  const totalPages = data?.pages ?? 1;

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[var(--text-dim)] mb-1.5 font-semibold uppercase tracking-wider">
          Управление
        </p>
        <h1
          className="text-[28px] sm:text-[32px] font-bold text-[var(--text-main)] leading-tight"
          style={{ letterSpacing: '-0.025em', fontFamily: 'var(--font-syne)' }}
        >
          Платежи
        </h1>
      </div>

      {/* Summary (shown once data loaded) */}
      {data && data.items.length > 0 && <PaymentsSummary payments={data.items} />}

      {/* Table card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-main)] shadow-[var(--shadow-card)] overflow-hidden"
      >
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[var(--accent-primary)]" />
          </div>
        )}

        {isError && (
          <div className="flex items-start gap-3 m-5 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>{error instanceof Error ? error.message : 'Не удалось загрузить платежи.'}</p>
          </div>
        )}

        {data && !isLoading && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-[var(--border-main)] bg-[var(--bg-surface-alt)]">
                    {['Дата', 'Email', 'Сумма', 'План', 'Статус', 'YooKassa ID'].map(
                      (col) => (
                        <th
                          key={col}
                          className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--text-dim)] uppercase tracking-wider whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-main)]">
                  {data.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-14 text-[var(--text-dim)] text-sm"
                      >
                        <TrendingUp size={28} className="mx-auto mb-2 opacity-30" />
                        Платежей пока нет
                      </td>
                    </tr>
                  ) : (
                    data.items.map((payment) => {
                      const date = new Date(payment.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                      const time = new Date(payment.created_at).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr
                          key={payment.id}
                          className="hover:bg-[var(--bg-surface-alt)] transition-colors"
                        >
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <p className="text-[13px] text-[var(--text-main)] font-mono">{date}</p>
                            <p className="text-[11px] text-[var(--text-dim)] font-mono">{time}</p>
                          </td>
                          <td className="px-4 py-3.5 max-w-[180px]">
                            {payment.user_email ? (
                              <span className="text-[13px] text-[var(--text-main)] truncate block">
                                {payment.user_email}
                              </span>
                            ) : (
                              <span className="text-[var(--text-dim)] text-[13px]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-[14px] font-semibold text-[var(--text-main)] font-mono">
                              {payment.amount.toLocaleString('ru-RU')}
                            </span>
                            <span className="text-[12px] text-[var(--text-dim)] ml-1">
                              {payment.currency}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {payment.plan ? (
                              <span
                                className={`text-[12px] font-semibold ${
                                  payment.plan === 'pro'
                                    ? 'text-orange-600'
                                    : payment.plan === 'team'
                                      ? 'text-violet-600'
                                      : 'text-[var(--text-dim)]'
                                }`}
                              >
                                {PLAN_LABELS[payment.plan] ?? payment.plan}
                              </span>
                            ) : (
                              <span className="text-[var(--text-dim)] text-[12px]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <PaymentStatusBadge status={payment.status} />
                          </td>
                          <td className="px-4 py-3.5">
                            <YookassaIdCell id={payment.yookassa_id} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-main)] bg-[var(--bg-surface-alt)]">
                <p className="text-[12px] text-[var(--text-dim)]">
                  Стр. {page} из {totalPages} · Всего: {data.total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-main)] text-[var(--text-dim)] hover:bg-[var(--bg-surface)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                          p === page
                            ? 'bg-[var(--accent-primary)] text-white border border-[var(--accent-primary)]'
                            : 'border border-[var(--border-main)] text-[var(--text-dim)] hover:bg-[var(--bg-surface)]'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-main)] text-[var(--text-dim)] hover:bg-[var(--bg-surface)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Info note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-5 flex items-start gap-2.5 p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface-alt)] text-[12px] text-[var(--text-dim)]"
      >
        <CreditCard size={14} className="shrink-0 mt-0.5" />
        <p>
          Данные платежей из YooKassa. Нажмите на YooKassa ID, чтобы скопировать идентификатор транзакции.
          Для возвратов используйте личный кабинет YooKassa.
        </p>
      </motion.div>
    </div>
  );
}
