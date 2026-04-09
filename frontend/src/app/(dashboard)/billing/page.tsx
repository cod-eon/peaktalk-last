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
import type { Payment, PaymentMethodSummary } from '@/types/billing';
import { toast } from 'sonner';

// ─── Plan comparison data ──────────────────────────────────────────────────────

const PLAN_DISPLAY: Array<{
  id: 'starter' | 'pro' | 'team';
  name: string;
  price: string;
  features: string[];
}> = [
  {
    id: 'starter',
    name: 'STARTER',
    price: 'Бесплатно',
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
          : { label: 'Отменён', cls: 'bg-neutral-100 text-neutral-500' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-none text-[11px] font-medium ${cfg.cls}`}>
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
        <div className="flex items-center gap-2 text-neutral-600 text-sm">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-neutral-500 text-xs font-mono">
          {isUnlimited ? (
            <span className="text-neutral-900 font-semibold flex items-center gap-1"><Infinity size={11} /> Безлимит</span>
          ) : (
            <span className={full ? 'text-red-500 font-semibold' : almostFull ? 'text-amber-600 font-medium' : ''}>
              {used} / {limit}
            </span>
          )}
        </span>
      </div>
      <div className="h-1.5 bg-neutral-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full ${
            isUnlimited
              ? 'bg-neutral-800'
              : full
                ? 'bg-red-500'
                : almostFull
                  ? 'bg-amber-400'
                  : 'bg-neutral-900'
          }`}
        />
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { status, isLoading, isPro } = useBillingStore();
  const { refetch } = useBilling();

  const paymentsEnabled = status?.payments_enabled ?? true;

  const handleTestSetPlan = useCallback(
    async (plan: 'starter' | 'pro' | 'team', periodDays?: number) => {
      try {
        await api.post('/billing/test/set-plan', { plan, period_days: periodDays ?? 30 });
        toast.success(`Тест: план изменён на ${plan.toUpperCase()}`);
        await refetch();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Ошибка';
        toast.error(message);
      }
    },
    [refetch],
  );

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['billing-payments'],
    queryFn: () => api.get('/billing/payments'),
    staleTime: 60_000,
    retry: false,
  });

  const {
    data: paymentMethod,
    isLoading: paymentMethodLoading,
    refetch: refetchPaymentMethod,
  } = useQuery<PaymentMethodSummary>({
    queryKey: ['billing-payment-method'],
    queryFn: () => api.get('/billing/payment-method'),
    staleTime: 60_000,
    retry: false,
    enabled: paymentsEnabled,
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
      await refetchPaymentMethod();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка';
      toast.error(message);
    }
  }, [refetch, refetchPaymentMethod]);

  const plan = status?.subscription.plan ?? 'starter';
  const isPaidPlan = plan === 'pro' || plan === 'team';
  const periodEnd = status?.subscription.period_end
    ? new Date(status.subscription.period_end).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const subStatus = status?.subscription.status;
  const autoRenewEnabled = paymentMethod?.auto_renew_enabled ?? false;
  const paymentMethodLabel = paymentMethod?.display_label ?? (paymentMethod?.is_bound ? 'Привязанный способ оплаты' : null);

  const PLAN_NAMES: Record<string, string> = { starter: 'Starter', pro: 'Pro', team: 'Team' };

  return (
    <div className="pb-16 pt-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 font-inter bg-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Подписка</h1>
          <p className="text-sm font-medium text-neutral-500 mt-1">Управление планом и история платежей.</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-neutral-900" />
        </div>
      )}

      {!isLoading && !paymentsEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-3 p-4 rounded-none border border-neutral-200 bg-neutral-50 text-sm text-neutral-700 mb-4"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-neutral-500" />
          <p>
            <span className="font-semibold">Платёжная система скоро заработает.</span>{' '}
            На время запуска все функции доступны без ограничений. Подписки будут активированы позже.
          </p>
        </motion.div>
      )}

      {!isLoading && !paymentsEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="border border-dashed border-neutral-300 rounded-none bg-neutral-50 p-4 mb-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-neutral-900 animate-pulse" />
            <span className="text-xs font-bold tracking-widest uppercase text-neutral-600 font-mono">
              Тест-режим
            </span>
          </div>
          <p className="text-xs text-neutral-500 mb-3">
            Платёжная система отключена. Переключайте план вручную, чтобы тестировать лимиты и интерфейс.
          </p>
          <div className="flex flex-wrap gap-2">
            {(['starter', 'pro', 'team'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handleTestSetPlan(p, p === 'starter' ? undefined : 30)}
                className={`px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer rounded-none border ${
                  plan === p
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                }`}
              >
                {plan === p ? '✓ ' : ''}{p.toUpperCase()}
              </button>
            ))}
            <button
              onClick={() => handleTestSetPlan('pro', -1)}
              className="px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer rounded-none border bg-white text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              PRO (истёк вчера)
            </button>
          </div>
        </motion.div>
      )}

      {!isLoading && (
        <div className="flex flex-col gap-6">

          {/* ─── Current plan card ─── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-none border border-neutral-200 p-6"
          >
            <h2 className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase mb-5">
              Текущий план
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-none bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                  {plan === 'team' ? (
                    <Users size={22} className="text-neutral-700" />
                  ) : plan === 'pro' ? (
                    <Zap size={22} className="text-neutral-700" />
                  ) : (
                    <CreditCard size={22} className="text-neutral-400" />
                  )}
                </div>
                <div>
                  <div className="text-xl font-bold text-neutral-900 tracking-tight">
                    {PLAN_NAMES[plan] ?? plan}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {subStatus === 'active' && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-none px-2.5 py-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse" />
                        Активна
                      </span>
                    )}
                    {subStatus === 'cancelled' && (
                      <span className="inline-flex items-center text-xs text-neutral-500 bg-neutral-100 rounded-none px-2.5 py-1">
                        Отменена
                      </span>
                    )}
                    {periodEnd && (
                      <span className="text-xs text-neutral-500">
                        {subStatus === 'cancelled' ? 'Доступ до' : 'Следующее списание'}: {periodEnd}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {paymentsEnabled && plan === 'starter' && (
                  <button
                    onClick={() => handleUpgrade('pro')}
                    className="inline-flex items-center gap-2 bg-[#171717] hover:bg-black text-white rounded-none px-5 py-2.5 text-sm font-semibold cursor-pointer"
                  >
                    <Zap size={14} />
                    Перейти на PRO
                  </button>
                )}
                {!paymentsEnabled && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none border border-neutral-200 bg-neutral-50 text-neutral-600 text-xs font-medium">
                    <Zap size={11} />
                    Скоро
                  </span>
                )}
                {paymentsEnabled && plan === 'pro' && (
                  <>
                    <button
                      onClick={() => handleUpgrade('team')}
                      className="inline-flex items-center gap-2 bg-[#171717] hover:bg-black text-white rounded-none px-5 py-2.5 text-sm font-semibold cursor-pointer"
                    >
                      <Users size={14} />
                      Апгрейд до TEAM
                    </button>
                  </>
                )}
                {paymentsEnabled && isPaidPlan && subStatus === 'active' && (
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-none border border-neutral-200 text-neutral-500 text-sm hover:border-red-200 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <X size={13} />
                    Отключить автопродление
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* ─── Renewal and payment method ─── */}
          {paymentsEnabled && isPaidPlan && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.03 }}
              className="bg-white rounded-none border border-neutral-200 p-6"
            >
              <h2 className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase mb-5">
                Списание и автопродление
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-neutral-500 mb-2">
                    <CreditCard size={12} />
                    Способ оплаты
                  </div>
                  {paymentMethodLoading ? (
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <Loader2 size={14} className="animate-spin" />
                      Загружаем способ оплаты...
                    </div>
                  ) : paymentMethodLabel ? (
                    <div className="text-sm font-semibold text-neutral-900">{paymentMethodLabel}</div>
                  ) : (
                    <div className="text-sm text-neutral-500">Привязанный способ оплаты пока не найден</div>
                  )}
                </div>

                <div className="border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-neutral-500 mb-2">
                    <Zap size={12} />
                    Автопродление
                  </div>
                  {subStatus === 'cancelled' ? (
                    <div className="text-sm text-neutral-700">
                      Отключено{periodEnd ? `, доступ сохранится до ${periodEnd}` : ''}
                    </div>
                  ) : subStatus === 'past_due' ? (
                    <div className="text-sm text-red-600">Есть проблема со списанием</div>
                  ) : autoRenewEnabled ? (
                    <div className="text-sm font-semibold text-emerald-700">
                      Включено{periodEnd ? `, следующее списание ${periodEnd}` : ''}
                    </div>
                  ) : (
                    <div className="text-sm text-neutral-500">Не настроено</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Usage bars ─── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="bg-white rounded-none border border-neutral-200 p-6"
          >
            <h2 className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase mb-5">
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
              <div className="text-sm text-neutral-500">Нет данных</div>
            )}
          </motion.div>

          {/* ─── Plan comparison ─── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-none border border-neutral-200 p-6"
          >
            <h2 className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase mb-5">
              Сравнение планов
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLAN_DISPLAY.map((p) => {
                const isCurrent = p.id === plan;
                const isDowngrade = plan === 'team' && p.id === 'pro';
                const canUpgradeToPlan =
                  paymentsEnabled &&
                  !isCurrent &&
                  p.id !== 'starter' &&
                  !isDowngrade &&
                  ((plan === 'starter' && (p.id === 'pro' || p.id === 'team')) ||
                    (plan === 'pro' && p.id === 'team'));
                return (
                  <div
                    key={p.id}
                    className={`relative rounded-none border p-4 transition-all ${
                      isCurrent
                        ? 'border-neutral-900 bg-neutral-50'
                        : 'border-neutral-200 bg-white hover:border-neutral-400'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute top-3 right-3 text-[9px] font-bold tracking-widest text-neutral-500 bg-white rounded-none px-2 py-1 border border-neutral-200 uppercase">
                        {plan === 'starter' ? 'Текущий' : 'Активирован'}
                      </span>
                    )}
                    <div className="mb-4">
                      <div className="text-sm font-bold tracking-wider text-neutral-900">
                        {p.name}
                      </div>
                      <div className="text-neutral-600 text-base font-semibold mt-0.5">
                        {p.price}
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[12px] text-neutral-600">
                          <Check size={10} className="mt-1 shrink-0 text-neutral-900" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {canUpgradeToPlan && (
                      <button
                        onClick={() => handleUpgrade(p.id as 'pro' | 'team')}
                        className="w-full py-2 rounded-none text-[12px] font-semibold bg-[#171717] hover:bg-black text-white transition-all cursor-pointer"
                      >
                        Выбрать {p.name}
                      </button>
                    )}
                    {!isCurrent && p.id !== 'starter' && !paymentsEnabled && (
                      <div className="w-full py-2 rounded-none text-[12px] font-semibold text-center text-neutral-500 bg-neutral-50 border border-neutral-200">
                        Скоро
                      </div>
                    )}
                    {isDowngrade && (
                      <div className="w-full py-2 rounded-none text-[12px] font-semibold text-center text-neutral-500 bg-neutral-50 border border-neutral-200">
                        Ваш тариф выше
                      </div>
                    )}
                    {isCurrent && (
                      <div className="text-[11px] text-neutral-500 text-center pt-1">
                        {plan === 'starter' ? 'Текущий бесплатный план' : 'Уже активирован'}
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
            className="bg-white rounded-none border border-neutral-200 p-6"
          >
            <h2 className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase mb-5">
              История платежей
            </h2>

            {paymentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-neutral-500" />
              </div>
            ) : payments && payments.length > 0 ? (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-2 px-2 text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                        Дата
                      </th>
                      <th className="text-left py-2 px-2 text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                        Описание
                      </th>
                      <th className="text-right py-2 px-2 text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                        Сумма
                      </th>
                      <th className="text-right py-2 px-2 text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-3 px-2 text-neutral-500 text-[12px] font-mono whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-2 text-neutral-900 text-[13px]">{p.description}</td>
                        <td className="py-3 px-2 text-right text-neutral-900 text-[13px] font-medium font-mono whitespace-nowrap">
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
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-neutral-400">
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
              className="flex items-start gap-3 p-4 rounded-none border border-amber-200 bg-amber-50 text-sm text-amber-800"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>
                Вы используете бесплатный план. При достижении лимитов симуляции и загрузка документов будут
                заблокированы.{' '}
                <button
                  onClick={() => handleUpgrade('pro')}
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
