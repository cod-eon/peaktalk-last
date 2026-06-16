'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Clock3, RefreshCcw, CreditCard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useBillingStore } from '@/store/billingStore';
import { trackEvent } from '@/lib/analytics';

export default function BillingSuccessPage() {
  const { fetchStatus, status, isLoading } = useBillingStore();
  const trackedSuccessRef = useRef(false);
  const [returnPath] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('return');
  });

  const activePlan = status?.subscription.plan;
  const isPaidPlan = Boolean(activePlan && ['personal', 'pro', 'team'].includes(activePlan));
  const hasSessionCredit = (status?.usage.session_credits ?? 0) > 0;
  const isConfirmed = Boolean(
    status?.subscription.status === 'active' && (isPaidPlan || hasSessionCredit),
  );
  const planLabel = hasSessionCredit && !isPaidPlan ? 'Разовая сессия' : (activePlan ?? 'pro').toUpperCase();
  const periodEnd = status?.subscription.period_end
    ? new Date(status.subscription.period_end).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  useEffect(() => {
    let attempts = 0;
    void fetchStatus();

    if (isConfirmed) {
      return;
    }

    const intervalId = window.setInterval(() => {
      attempts += 1;
      void fetchStatus();
      if (attempts >= 5) {
        window.clearInterval(intervalId);
      }
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [fetchStatus, isConfirmed]);

  useEffect(() => {
    if (!isConfirmed || trackedSuccessRef.current) return;
    trackedSuccessRef.current = true;

    let paymentContext: Record<string, string | null> = {};
    try {
      const raw = sessionStorage.getItem('peaktalk_payment_context');
      paymentContext = raw ? JSON.parse(raw) : {};
      sessionStorage.removeItem('peaktalk_payment_context');
    } catch {
      paymentContext = {};
    }

    trackEvent('payment_succeeded', {
      source: paymentContext.return_path === '/simulation/from-guest' ? 'guest_paywall' : 'billing_success',
      payment_plan: paymentContext.payment_plan ?? planLabel,
      payment_id: paymentContext.payment_id ?? null,
      return_path: paymentContext.return_path ?? returnPath ?? '/billing/success',
      plan_context: paymentContext.plan_context ?? planLabel,
    });
  }, [isConfirmed, planLabel, returnPath]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-16 font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <div className="font-mono text-[10px] font-bold text-[#73706A] tracking-[0.18em] uppercase mb-2">
            Подписка
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
            {isConfirmed ? 'Подписка подключена' : 'Платёж получен'}
          </h1>
          <p className="text-sm font-medium text-[#73706A] mt-1 max-w-xl">
            {isConfirmed
              ? 'Биллинг подтвердил активацию тарифа. Можно возвращаться к симуляциям.'
              : 'Ждём подтверждение от платёжного провайдера и синхронизацию статуса.'}
          </p>
        </div>
      </div>

      <div className="relative w-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white border border-[#D9D5CC] rounded-none p-6 md:p-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] gap-6 items-start">
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 shrink-0 border flex items-center justify-center ${isConfirmed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-neutral-200 bg-neutral-50 text-neutral-600'}`}>
                  {isConfirmed ? <CheckCircle2 size={24} /> : <Clock3 size={24} />}
                </div>
                <div className="flex flex-col gap-2">
                  <div className={`inline-flex items-center gap-2 w-fit px-3 py-1.5 border text-xs font-semibold tracking-wide uppercase ${isConfirmed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-neutral-200 bg-neutral-50 text-neutral-600'}`}>
                    {isConfirmed ? <ShieldCheck size={14} /> : <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />}
                    {isConfirmed ? 'Статус подтверждён' : isLoading ? 'Синхронизация' : 'Ожидаем webhook'}
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                    {isConfirmed ? `${planLabel} активирован` : 'Проверяем активацию подписки'}
                  </h2>
                  <p className="text-sm leading-relaxed text-neutral-600 max-w-2xl">
                    {isConfirmed
                      ? 'Платёж успешно зафиксирован в системе. Доступ уже открыт, а управление тарифом и автопродлением доступно в биллинге.'
                      : 'Провайдер вернул успешный статус оплаты, но финальная активация ещё не дошла до биллинга. Обычно синхронизация завершается автоматически в течение нескольких секунд.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-[#D9D5CC] bg-[#FAF8F4] p-4">
                  <div className="font-mono text-[10px] font-bold text-[#73706A] tracking-[0.18em] uppercase mb-2">
                    Тариф
                  </div>
                  <div className="text-lg font-bold text-neutral-900 tracking-tight">
                    {isConfirmed ? planLabel : 'Ожидаем подтверждение'}
                  </div>
                  <div className="text-sm text-neutral-500 mt-1">
                    {isConfirmed ? 'Подписка активна и готова к использованию.' : 'Статус обновится автоматически.'}
                  </div>
                </div>

                <div className="border border-[#D9D5CC] bg-[#FAF8F4] p-4">
                  <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-[#73706A] tracking-[0.18em] uppercase mb-2">
                    <CreditCard size={12} />
                    Биллинг
                  </div>
                  <div className="text-lg font-bold text-neutral-900 tracking-tight">
                    {isConfirmed ? 'Подтверждено' : isLoading ? 'Проверяем' : 'В обработке'}
                  </div>
                  <div className="text-sm text-neutral-500 mt-1">
                    {isConfirmed && periodEnd
                      ? `Следующее списание: ${periodEnd}`
                      : 'Если статус не обновился, откройте страницу подписки и повторите проверку.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-[#D9D5CC] bg-white p-5 flex flex-col gap-3">
              <div>
                <div className="font-mono text-[10px] font-bold text-[#73706A] tracking-[0.18em] uppercase mb-2">
                  Следующее действие
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {isConfirmed
                    ? returnPath === '/simulation/from-guest'
                      ? 'Оплата подтверждена. Теперь можно перенести гостевой стресс-тест в полную сессию.'
                      : 'Можно сразу запускать следующую симуляцию или вернуться в биллинг, если хочешь проверить тариф и автопродление.'
                    : 'Если активация ещё не дошла, можно вручную обновить статус или открыть биллинг и убедиться, что тариф уже переключился.'}
                </p>
              </div>

              {isConfirmed ? (
                <Link
                  href={returnPath ?? '/simulation'}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-none bg-[#171717] hover:bg-black text-white font-semibold text-sm transition-all cursor-pointer"
                >
                  {returnPath === '/simulation/from-guest' ? 'Продолжить подготовку' : 'Начать симуляцию'}
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void fetchStatus()}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-none bg-[#171717] hover:bg-black text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-60"
                  disabled={isLoading}
                >
                  Проверить статус
                  <RefreshCcw size={15} className={isLoading ? 'animate-spin' : ''} />
                </button>
              )}

              <Link
                href="/billing"
                className="w-full flex items-center justify-center gap-2 h-11 rounded-none border border-neutral-200 bg-white hover:border-neutral-400 text-neutral-700 hover:text-neutral-900 font-semibold text-sm transition-colors"
              >
                Управление подпиской
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
