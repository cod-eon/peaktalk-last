'use client';

import React, { Suspense, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Check,
  CreditCard,
  FileText,
  Infinity,
  Loader2,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useBillingStore } from '@/store/billingStore';
import { useBilling } from '@/hooks/useBilling';
import { PerSessionCard } from '@/components/billing/PerSessionCard';
import { SessionCreditsDisplay } from '@/components/billing/SessionCreditsDisplay';
import type { Payment, PaymentMethodSummary } from '@/types/billing';
import { toast } from 'sonner';

const PLAN_DISPLAY: Array<{
  id: 'per_session' | 'personal' | 'pro' | 'team';
  name: string;
  price: string;
  badge?: string;
  features: string[];
}> = [
  {
    id: 'personal',
    name: 'PERSONAL',
    price: '790 ₽/мес',
    badge: 'частая практика',
    features: ['10 сессий в месяц', 'Все персоны', 'PDF-отчёты', 'Шпаргалки'],
  },
  {
    id: 'pro',
    name: 'PRO',
    price: '1 490 ₽/мес',
    badge: 'рекомендуемый',
    features: ['Безлимитные сессии', 'Расширенная аналитика', 'PDF-отчёты', 'Приоритетная поддержка'],
  },
  {
    id: 'team',
    name: 'TEAM',
    price: '4 990 ₽/мес',
    badge: 'в разработке',
    features: ['5 мест', 'Всё из PRO', 'Командный dashboard', 'Общая библиотека документов'],
  },
];

const PLAN_NAMES: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  per_session: 'За сессию',
  personal: 'Personal',
  pro: 'Pro',
  team: 'Team',
};

const PLAN_RANK: Record<string, number> = {
  free: 0,
  starter: 0,
  per_session: 0,
  personal: 1,
  pro: 2,
  team: 3,
};

function PaymentStatusBadge({ status }: { status: string }) {
  const cfg =
    status === 'succeeded'
      ? { label: 'Оплачен', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      : status === 'pending'
        ? { label: 'Ожидание', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
        : status === 'failed'
          ? { label: 'Ошибка', cls: 'bg-red-50 text-red-600 border-red-200' }
          : { label: 'Отменён', cls: 'bg-neutral-100 text-neutral-500 border-neutral-200' };

  return (
    <span className={`inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold rounded-none ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function UsageBar({ used, limit, label, icon }: { used: number; limit: number | null; label: string; icon: React.ReactNode }) {
  const isUnlimited = limit === null;
  const pct = isUnlimited ? 100 : Math.min(100, (used / (limit || 1)) * 100);
  const almostFull = !isUnlimited && pct >= 66;
  const full = !isUnlimited && pct >= 100;

  return (
    <div className="border border-[#D9D5CC] bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-mono text-[11px] text-[#73706A]">
          {isUnlimited ? (
            <span className="flex items-center gap-1 font-bold text-[#111827]"><Infinity size={11} /> Безлимит</span>
          ) : (
            <span className={full ? 'font-bold text-red-600' : almostFull ? 'font-bold text-amber-700' : ''}>
              {used} / {limit}
            </span>
          )}
        </span>
      </div>
      <div className="h-1.5 bg-neutral-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full ${isUnlimited ? 'bg-[#111827]' : full ? 'bg-red-500' : almostFull ? 'bg-[#E8600A]' : 'bg-[#111827]'}`}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (status === 'active') {
    return <span className="inline-flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 rounded-none"><span className="h-1.5 w-1.5 bg-emerald-500" />Активна</span>;
  }
  if (status === 'trialing') {
    return <span className="inline-flex border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 rounded-none">Пробный период</span>;
  }
  if (status === 'cancelled') {
    return <span className="inline-flex border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-500 rounded-none">Отменена</span>;
  }
  if (status === 'past_due') {
    return <span className="inline-flex border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 rounded-none">Проблема оплаты</span>;
  }
  if (status === 'incomplete') {
    return <span className="inline-flex border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 rounded-none">Требует подтверждения оплаты</span>;
  }
  return <span className="inline-flex border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-500 rounded-none">{status ?? 'Нет подписки'}</span>;
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div>}>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const { status, isLoading } = useBillingStore();
  const isPro = useBillingStore((s) => s.isPro());
  const { refetch } = useBilling();
  const searchParams = useSearchParams();

  const planParam = searchParams.get('plan');
  const returnPath = searchParams.get('return') ?? undefined;
  const highlightPerSession = planParam === 'per_session';
  const paymentsEnabled = status?.payments_enabled ?? true;
  const sessionCredits = status?.usage.session_credits ?? 0;

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

  const handleTestSetPlan = useCallback(
    async (plan: 'free' | 'personal' | 'pro' | 'team', periodDays?: number) => {
      try {
        await api.post('/billing/test/set-plan', { plan, period_days: periodDays ?? 30 });
        toast.success(`Тест: план изменён на ${plan.toUpperCase()}`);
        await refetch();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Ошибка');
      }
    },
    [refetch],
  );

  const handleUpgrade = useCallback(
    async (plan: string) => {
      try {
        const successPath = returnPath ?? '/billing/success';
        const returnUrl = `${window.location.origin}${successPath}`;
        const res = await api.post('/billing/payment', { plan, return_url: returnUrl });
        if (res?.payment_url) window.location.href = res.payment_url;
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Ошибка оплаты');
      }
    },
    [returnPath],
  );

  const handleCancel = useCallback(async () => {
    if (!window.confirm('Вы уверены, что хотите отменить подписку? Доступ сохранится до конца оплаченного периода.')) return;
    try {
      await api.post('/billing/cancel', {});
      toast.success('Подписка отменена');
      await refetch();
      await refetchPaymentMethod();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    }
  }, [refetch, refetchPaymentMethod]);

  const plan = status?.subscription.plan ?? 'free';
  const subStatus = status?.subscription.status;
  const isPaidPlan = ['personal', 'pro', 'team'].includes(plan);
  const periodEnd = status?.subscription.period_end
    ? new Date(status.subscription.period_end).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const paymentMethodLabel = paymentMethod?.display_label ?? (paymentMethod?.is_bound ? 'Привязанный способ оплаты' : null);
  const autoRenewEnabled = paymentMethod?.auto_renew_enabled ?? false;

  useEffect(() => {
    if (returnPath && typeof window !== 'undefined') {
      sessionStorage.setItem('billing_return_path', returnPath);
    }
  }, [returnPath]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-16 font-inter">
      <div className="mb-6 sm:mb-8 flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#111827]">Подписка и лимиты</h1>
        <p className="max-w-2xl text-sm text-[#73706A]">
          Оплата должна оставаться понятной частью подготовки к сложной встрече.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center border border-[#D9D5CC] bg-white py-20">
          <Loader2 size={28} className="animate-spin text-[#111827]" />
        </div>
      ) : (
        <div className="space-y-5">
          {!paymentsEnabled && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-dashed border-[#D9D5CC] bg-white p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3 text-sm text-[#73706A]">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#111827]" />
                  <div>
                    <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#111827]">Тест-режим платежей</div>
                    <p className="mt-1">Платёжная система отключена. Лимиты и тарифы можно переключать вручную.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['free', 'personal', 'pro', 'team'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleTestSetPlan(p, p === 'free' ? undefined : 30)}
                      className={`border px-3 py-1.5 text-xs font-semibold transition-colors rounded-none ${
                        plan === p ? 'border-[#111827] bg-[#111827] text-white' : 'border-[#D9D5CC] bg-white text-[#111827] hover:border-[#111827]'
                      }`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                  <button
                    onClick={() => handleTestSetPlan('pro', -1)}
                    className="border border-[#F9BD8E] bg-[#FEF3E8] px-3 py-1.5 text-xs font-semibold text-[#B04A08] rounded-none"
                  >
                    PRO истёк
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <div className={`grid grid-cols-1 gap-5 ${!isPaidPlan ? "xl:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-[#D9D5CC] bg-white"
            >
              <div className="border-b border-[#D9D5CC] p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#73706A]">Текущий план</div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="text-4xl font-black tracking-tight text-[#111827]">{PLAN_NAMES[plan] ?? plan}</div>
                      <StatusBadge status={subStatus} />
                      {sessionCredits > 0 && <SessionCreditsDisplay credits={sessionCredits} />}
                    </div>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#73706A]">
                      {periodEnd
                        ? `${subStatus === 'cancelled' ? 'Доступ сохранится до' : 'Следующее списание'}: ${periodEnd}.`
                        : 'План без даты списания. Подходит для разовой подготовки или тестового режима.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {paymentsEnabled && isPaidPlan && subStatus === 'active' && (
                      <button
                        onClick={handleCancel}
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#D9D5CC] px-4 text-sm font-semibold text-[#73706A] hover:border-red-200 hover:text-red-600 rounded-none"
                      >
                        <X size={13} /> Отключить автопродление
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:p-6 lg:grid-cols-2">
                {status ? (
                  <>
                    <UsageBar used={status.usage.simulations_used} limit={status.limits.simulations_per_month} label="Симуляции" icon={<Zap size={14} />} />
                    <UsageBar used={status.usage.documents_uploaded} limit={status.limits.documents_total} label="Документы" icon={<FileText size={14} />} />
                  </>
                ) : (
                  <div className="text-sm text-[#73706A]">Нет данных по использованию</div>
                )}
              </div>

              {paymentsEnabled && isPaidPlan && (
                <div className="grid grid-cols-1 border-t border-[#D9D5CC] lg:grid-cols-2 lg:divide-x lg:divide-[#D9D5CC]">
                  <div className="p-5 sm:p-6">
                    <div className="mb-2 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#73706A]">
                      <CreditCard size={12} /> Способ оплаты
                    </div>
                    {paymentMethodLoading ? (
                      <div className="flex items-center gap-2 text-sm text-[#73706A]"><Loader2 size={14} className="animate-spin" />Загружаем...</div>
                    ) : (
                      <div className="text-sm font-semibold text-[#111827]">{paymentMethodLabel ?? 'Способ оплаты пока не найден'}</div>
                    )}
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="mb-2 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#73706A]">
                      <ShieldCheck size={12} /> Автопродление
                    </div>
                    <div className={`text-sm font-semibold ${subStatus === 'past_due' ? 'text-red-600' : autoRenewEnabled ? 'text-emerald-700' : 'text-[#73706A]'}`}>
                      {subStatus === 'cancelled'
                        ? `Отключено${periodEnd ? `, доступ до ${periodEnd}` : ''}`
                        : subStatus === 'past_due'
                          ? 'Есть проблема со списанием'
                          : autoRenewEnabled
                            ? `Включено${periodEnd ? `, следующее списание ${periodEnd}` : ''}`
                            : 'Не настроено'}
                    </div>
                  </div>
                </div>
              )}
            </motion.section>


          </div>

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="border border-[#D9D5CC] bg-white p-5 sm:p-6"
          >
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#73706A]">Тарифы</div>
                <h2 className="mt-2 text-xl font-black tracking-tight text-[#111827]">Выберите режим подготовки</h2>
              </div>
              <p className="max-w-md text-sm text-[#73706A]">Разовая покупка — для одной защиты. Подписка — для регулярных QBR, бюджетов и клиентских эскалаций.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {PLAN_DISPLAY.map((p) => {
                const isCurrent = p.id === plan;
                const isDowngrade = PLAN_RANK[p.id] < PLAN_RANK[plan];
                const canUpgradeToPlan = paymentsEnabled && p.id !== 'team' && !isCurrent && !isDowngrade && PLAN_RANK[p.id] > PLAN_RANK[plan];

                return (
                  <div
                    key={p.id}
                    className={`relative flex min-h-[250px] flex-col border p-4 transition-colors ${
                      isCurrent ? 'border-[#111827] bg-[#FAF8F4]' : 'border-[#D9D5CC] bg-white hover:border-[#111827]'
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute right-3 top-3 border border-[#D9D5CC] bg-white px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#73706A] rounded-none">
                        {isCurrent ? 'активен' : p.badge}
                      </span>
                    )}
                    <div className="mb-5 pr-20">
                      <div className="font-mono text-[11px] font-bold tracking-[0.16em] text-[#111827]">{p.name}</div>
                      <div className="mt-2 text-2xl font-black tracking-tight text-[#111827]">{p.price}</div>
                    </div>
                    <ul className="mb-5 space-y-2">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[13px] leading-snug text-[#73706A]">
                          <Check size={12} className="mt-0.5 shrink-0 text-[#111827]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto">
                      {canUpgradeToPlan && (
                        <button onClick={() => handleUpgrade(p.id)} className="w-full bg-[#111827] px-3 py-2.5 text-sm font-bold text-white hover:bg-black rounded-none">
                          Выбрать
                        </button>
                      )}
                      {!isCurrent && !paymentsEnabled && <div className="w-full border border-[#D9D5CC] bg-neutral-50 px-3 py-2.5 text-center text-sm font-semibold text-[#73706A]">Скоро</div>}
                      {p.id === 'team' && !isCurrent && <div className="w-full border border-[#D9D5CC] bg-neutral-50 px-3 py-2.5 text-center text-sm font-semibold text-[#73706A]">В разработке</div>}
                      {isDowngrade && !isCurrent && p.id !== 'team' && <div className="w-full border border-[#D9D5CC] bg-neutral-50 px-3 py-2.5 text-center text-sm font-semibold text-[#73706A]">Ваш тариф выше</div>}
                      {isCurrent && <div className="w-full border border-[#111827] bg-[#111827] px-3 py-2.5 text-center text-sm font-bold text-white">Активирован</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="border border-[#D9D5CC] bg-white"
          >
            <div className="flex items-center justify-between border-b border-[#D9D5CC] p-5 sm:p-6">
              <div>
                <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#73706A]">Платежи</div>
                <h2 className="mt-2 text-xl font-black tracking-tight text-[#111827]">История операций</h2>
              </div>
              <ReceiptText size={18} className="text-[#111827]" />
            </div>

            {paymentsLoading ? (
              <div className="flex items-center justify-center py-10"><Loader2 size={20} className="animate-spin text-[#73706A]" /></div>
            ) : payments && payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-[#D9D5CC] bg-[#FAF8F4]">
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#73706A]">Дата</th>
                      <th className="px-5 py-3 text-left font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#73706A]">Описание</th>
                      <th className="px-5 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#73706A]">Сумма</th>
                      <th className="px-5 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#73706A]">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {payments.slice(0, 8).map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF8F4]">
                        <td className="whitespace-nowrap px-5 py-3 font-mono text-[12px] text-[#73706A]">
                          {new Date(p.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3 text-[13px] font-medium text-[#111827]">{p.description}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right font-mono text-[13px] font-bold text-[#111827]">
                          {p.amount.toLocaleString('ru-RU')} {p.currency}
                        </td>
                        <td className="px-5 py-3 text-right"><PaymentStatusBadge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-[#73706A]">
                <TrendingUp size={24} className="opacity-40" />
                <p className="text-sm">Платежей пока нет</p>
              </div>
            )}
          </motion.section>

          {!isPro && paymentsEnabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3 border border-[#F9BD8E] bg-[#FEF3E8] p-4 text-sm text-[#B04A08]"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>
                Бесплатный план ограничен по симуляциям и документам. Можно купить одну подготовку за 299 ₽ или перейти на регулярный план от 790 ₽/мес.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
