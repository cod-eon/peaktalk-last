'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Zap,
  Check,
  Infinity,
  AlertCircle,
  Loader2,
  Users,
  FileText,
  TrendingUp,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useBillingStore } from '@/store/billingStore';
import { useBilling } from '@/hooks/useBilling';
import { UpgradeModal } from '@/components/UpgradeModal';
import type { Payment, PlanInfo } from '@/types/billing';
import { toast } from 'sonner';

// ─── Plan comparison data ──────────────────────────────────────────────────────

const PLAN_DISPLAY: Array<{
  id: 'starter' | 'pro' | 'team';
  name: string;
  price: string;
  accent: string;
  border: string;
  features: string[];
}> = [
  {
    id: 'starter',
    name: 'STARTER',
    price: 'Бесплатно',
    accent: 'text-[var(--text-dim)]',
    border: 'border-[var(--border-main)]',
    features: [
      '3 симуляции в месяц',
      '3 документа',
      '3 базовые персоны',
      'Без PDF отчётов',
    ],
  },
  {
    id: 'pro',
    name: 'PRO',
    price: '990 ₽/мес',
    accent: 'text-orange-500',
    border: 'border-orange-400',
    features: [
      'Безлимитные симуляции',
      'Безлимитные документы',
      'Все 15+ персон',
      'PDF отчёты',
      'Приоритетная поддержка',
    ],
  },
  {
    id: 'team',
    name: 'TEAM',
    price: '2 490 ₽/мес',
    accent: 'text-violet-500',
    border: 'border-violet-400',
    features: [
      'Всё из PRO',
      'До 10 участников',
      'Командная аналитика',
      'Общая библиотека документов',
      'Выделенная поддержка',
    ],
  },
];

// ─── Payment status badge ──────────────────────────────────────────────────────

function PaymentStatusBadge({ status }: { status: string }) {
  const cfg =
    status === 'succeeded'
      ? { label: 'Оплачен', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
      : status === 'pending'
        ? { label: 'Ожидание', cls: 'bg-amber-50 text-amber-700 border border-amber-200' }
        : status === 'failed'
          ? { label: 'Ошибка', cls: 'bg-red-50 text-red-600 border border-red-200' }
          : { label: 'Отменён', cls: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────────

function UsageBar({ used, limit, label, icon }: { used: number; limit: number | null; label: string; icon: React.ReactNode }) {
  const isUnlimited = limit === null;
  const pct = isUnlimited ? 100 : Math.min(100, (used / (limit || 1)) * 100);
  const almostFull = !isUnlimited && pct >= 66;
  const full = !isUnlimited && pct >= 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-[var(--text-dim)] text-xs font-mono">
          {isUnlimited ? (
            <span className="text-orange-500 font-semibold flex items-center gap-1"><Infinity size={11} /> Безлимит</span>
          ) : (
            <span className={full ? 'text-red-500 font-semibold' : almostFull ? 'text-amber-600 font-medium' : ''}>
              {used} / {limit}
            </span>
          )}
        </span>
      </div>
      <div className="h-1.5 bg-[var(--bg-surface-alt)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            isUnlimited
              ? 'bg-gradient-to-r from-orange-400 to-amber-300'
              : full
                ? 'bg-red-500'
                : almostFull
                  ? 'bg-amber-400'
                  : 'bg-[var(--accent-primary)]'
          }`}
        />
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { status, isLoading, isPro, upgradeModalOpen, upgradeModalReason, openUpgradeModal, closeUpgradeModal } =
    useBillingStore();
  const { refetch } = useBilling();

  const paymentsEnabled = status?.payments_enabled ?? true;

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['billing-payments'],
    queryFn: () => api.get('/billing/payments'),
    staleTime: 60_000,
    retry: false,
  });

  const handleUpgrade = useCallback(
    async (plan: 'pro' | 'team') => {
      try {
        const returnUrl = `${window.location.origin}/billing/success`;
        const res = await api.post('/billing/payment', { plan, return_url: returnUrl });
        if (res?.payment_url) {
          window.location.href = res.payment_url;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Ошибка оплаты';
        toast.error(message);
      }
    },
    [],
  );

  const handleCancel = useCallback(async () => {
    if (!window.confirm('Вы уверены, что хотите отменить подписку? Доступ к PRO функциям сохранится до конца оплаченного периода.')) return;
    try {
      await api.post('/billing/cancel', {});
      toast.success('Подписка отменена');
      await refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка';
      toast.error(message);
    }
  }, [refetch]);

  const plan = status?.subscription.plan ?? 'starter';
  const periodEnd = status?.subscription.period_end
    ? new Date(status.subscription.period_end).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const subStatus = status?.subscription.status;

  const PLAN_NAMES: Record<string, string> = { starter: 'Starter', pro: 'Pro', team: 'Team' };

  return (
    <div className="pb-16 md:pb-10 pt-8 sm:pt-10 w-full max-w-5xl mx-auto px-5 lg:px-8">
      <UpgradeModal isOpen={upgradeModalOpen} onClose={closeUpgradeModal} reason={upgradeModalReason} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-[13px] text-[var(--text-dim)] mb-1.5 font-medium">Управление</p>
          <h1
            className="text-[26px] sm:text-[30px] font-bold text-[var(--text-main)] leading-tight"
            style={{ letterSpacing: '-0.025em', fontFamily: 'var(--font-syne)' }}
          >
            Подписка
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-1 text-[var(--text-dim)]">
          <CreditCard size={18} />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[var(--accent-primary)]" />
        </div>
      )}

      {!isLoading && !paymentsEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-3 p-4 rounded-xl border border-violet-200 bg-violet-50 text-sm text-violet-800 mb-2"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-violet-500" />
          <p>
            <span className="font-semibold">Платёжная система скоро заработает.</span>{' '}
            На время запуска все функции доступны без ограничений. Подписки будут активированы позже.
          </p>
        </motion.div>
      )}

      {!isLoading && (
        <div className="flex flex-col gap-6">

          {/* ─── Current plan card ─── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-main)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
          >
            <h2
              className="text-base font-semibold text-[var(--text-main)] mb-4"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              Текущий план
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    plan === 'team'
                      ? 'bg-violet-100'
                      : plan === 'pro'
                        ? 'bg-orange-100'
                        : 'bg-gray-100'
                  }`}
                >
                  {plan === 'team' ? (
                    <Users size={22} className="text-violet-500" />
                  ) : plan === 'pro' ? (
                    <Zap size={22} className="text-orange-500" />
                  ) : (
                    <CreditCard size={22} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <div
                    className="text-xl font-bold text-[var(--text-main)]"
                    style={{ fontFamily: 'var(--font-syne)' }}
                  >
                    {PLAN_NAMES[plan] ?? plan}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {subStatus === 'active' && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Активна
                      </span>
                    )}
                    {subStatus === 'cancelled' && (
                      <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        Отменена
                      </span>
                    )}
                    {periodEnd && (
                      <span className="text-xs text-[var(--text-dim)]">
                        {subStatus === 'cancelled' ? 'Доступ до' : 'Следующее списание'}: {periodEnd}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {paymentsEnabled && plan === 'starter' && (
                  <button
                    onClick={() => openUpgradeModal('simulations')}
                    className="btn-primary gap-2 text-sm cursor-pointer"
                  >
                    <Zap size={14} />
                    Перейти на PRO
                  </button>
                )}
                {!paymentsEnabled && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 text-xs font-medium">
                    <Zap size={11} />
                    Скоро
                  </span>
                )}
                {paymentsEnabled && plan === 'pro' && (
                  <>
                    <button
                      onClick={() => handleUpgrade('team')}
                      className="btn-primary gap-2 text-sm cursor-pointer"
                    >
                      <Users size={14} />
                      Апгрейд до TEAM
                    </button>
                    {subStatus === 'active' && (
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border-main)] text-[var(--text-dim)] text-sm hover:border-red-200 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <X size={13} />
                        Отменить
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* ─── Usage bars ─── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-main)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
          >
            <h2
              className="text-base font-semibold text-[var(--text-main)] mb-5"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              Использование в этом месяце
            </h2>
            {status ? (
              <div className="flex flex-col gap-5">
                <UsageBar
                  used={status.usage.simulations_used}
                  limit={status.limits.simulations_per_month}
                  label="Симуляции"
                  icon={<Zap size={14} />}
                />
                <UsageBar
                  used={status.usage.documents_uploaded}
                  limit={status.limits.documents_total}
                  label="Документы"
                  icon={<FileText size={14} />}
                />
              </div>
            ) : (
              <div className="text-sm text-[var(--text-dim)]">Нет данных</div>
            )}
          </motion.div>

          {/* ─── Plan comparison ─── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-main)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
          >
            <h2
              className="text-base font-semibold text-[var(--text-main)] mb-5"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              Сравнение планов
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLAN_DISPLAY.map((p) => {
                const isCurrent = p.id === plan;
                return (
                  <div
                    key={p.id}
                    className={`relative rounded-xl border-2 p-4 transition-all ${
                      isCurrent
                        ? p.border + ' bg-[var(--bg-surface-alt)]'
                        : 'border-[var(--border-main)] bg-[var(--bg-surface)] hover:border-[var(--border-light)]'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute top-3 right-3 text-[9px] font-bold tracking-widest text-[var(--text-dim)] bg-[var(--bg-card)] px-1.5 py-0.5 rounded-full border border-[var(--border-main)] uppercase">
                        Текущий
                      </span>
                    )}
                    <div className="mb-4">
                      <div
                        className={`text-sm font-bold tracking-wider ${p.accent}`}
                        style={{ fontFamily: 'var(--font-syne)' }}
                      >
                        {p.name}
                      </div>
                      <div className="text-[var(--text-muted)] text-base font-semibold mt-0.5">
                        {p.price}
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[12px] text-[var(--text-muted)]">
                          <Check size={10} className="mt-1 shrink-0 text-[var(--accent-primary)]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {!isCurrent && p.id !== 'starter' && paymentsEnabled && (
                      <button
                        onClick={() => handleUpgrade(p.id as 'pro' | 'team')}
                        className={`w-full py-2 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                          p.id === 'pro'
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'bg-violet-500 hover:bg-violet-600 text-white'
                        }`}
                      >
                        Выбрать {p.name}
                      </button>
                    )}
                    {!isCurrent && p.id !== 'starter' && !paymentsEnabled && (
                      <div className="w-full py-2 rounded-lg text-[12px] font-semibold text-center text-violet-500 bg-violet-50 border border-violet-200">
                        Скоро
                      </div>
                    )}
                    {isCurrent && plan !== 'starter' && (
                      <div className="text-[11px] text-[var(--text-dim)] text-center pt-1">
                        Активный план
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ─── Payment history ─── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-main)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
          >
            <h2
              className="text-base font-semibold text-[var(--text-main)] mb-5"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              История платежей
            </h2>

            {paymentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-[var(--text-dim)]" />
              </div>
            ) : payments && payments.length > 0 ? (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-main)]">
                      <th className="text-left py-2 px-2 text-[11px] font-semibold text-[var(--text-dim)] uppercase tracking-wide">
                        Дата
                      </th>
                      <th className="text-left py-2 px-2 text-[11px] font-semibold text-[var(--text-dim)] uppercase tracking-wide">
                        Описание
                      </th>
                      <th className="text-right py-2 px-2 text-[11px] font-semibold text-[var(--text-dim)] uppercase tracking-wide">
                        Сумма
                      </th>
                      <th className="text-right py-2 px-2 text-[11px] font-semibold text-[var(--text-dim)] uppercase tracking-wide">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-main)]">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-[var(--bg-surface-alt)] transition-colors">
                        <td className="py-3 px-2 text-[var(--text-muted)] text-[12px] font-mono whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-2 text-[var(--text-main)] text-[13px]">{p.description}</td>
                        <td className="py-3 px-2 text-right text-[var(--text-main)] text-[13px] font-medium font-mono whitespace-nowrap">
                          {p.amount.toLocaleString('ru-RU')} {p.currency}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <PaymentStatusBadge status={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-[var(--text-dim)]">
                <TrendingUp size={24} className="opacity-40" />
                <p className="text-sm">Платежей пока нет</p>
              </div>
            )}
          </motion.div>

          {/* Notice */}
          {!isPro && paymentsEnabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-800"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>
                Вы используете бесплатный план. При достижении лимитов симуляции и загрузка документов будут
                заблокированы.{' '}
                <button
                  onClick={() => openUpgradeModal('simulations')}
                  className="underline font-medium cursor-pointer hover:text-amber-900"
                >
                  Перейти на PRO
                </button>
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
