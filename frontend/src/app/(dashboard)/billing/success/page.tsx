'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Clock3, RefreshCcw, CreditCard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useBillingStore } from '@/store/billingStore';

export default function BillingSuccessPage() {
  const { fetchStatus, status, isLoading } = useBillingStore();

  const activePlan = status?.subscription.plan;
  const isPaidPlan = Boolean(activePlan && ['personal', 'pro', 'team'].includes(activePlan));
  const hasSessionCredit = (status?.usage.session_credits ?? 0) > 0;
  const isConfirmed = Boolean(
    status?.subscription.status === 'active' && (isPaidPlan || hasSessionCredit),
  );
  const planLabel = hasSessionCredit && !isPaidPlan ? 'РАЗОВАЯ СЕССИЯ' : (activePlan ?? 'pro').toUpperCase();
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 font-inter bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <div className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase mb-2">
            Платежи
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
            {isConfirmed ? 'Подписка подключена' : 'Платёж получен'}
          </h1>
          <p className="text-sm font-medium text-neutral-500 mt-1">
            {isConfirmed
              ? 'Биллинг подтвердил активацию тарифа. Можно возвращаться к тренировкам.'
              : 'Ждём подтверждение от платёжного провайдера и синхронизацию статуса.'}
          </p>
        </div>
      </div>

      <div className="relative w-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white border border-neutral-200 rounded-none p-6 md:p-8"
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
                <div className="border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase mb-2">
                    Тариф
                  </div>
                  <div className="text-lg font-bold text-neutral-900 tracking-tight">
                    {isConfirmed ? planLabel : 'Ожидаем подтверждение'}
                  </div>
                  <div className="text-sm text-neutral-500 mt-1">
                    {isConfirmed ? 'Подписка активна и готова к использованию.' : 'Статус обновится автоматически.'}
                  </div>
                </div>

                <div className="border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-500 tracking-widest uppercase mb-2">
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

            <div className="border border-neutral-200 bg-white p-5 flex flex-col gap-3">
              <div>
                <div className="text-[11px] font-bold text-neutral-500 tracking-widest uppercase mb-2">
                  Следующее действие
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {isConfirmed
                    ? 'Можно сразу запускать следующую симуляцию или вернуться в биллинг, если хочешь проверить тариф и автопродление.'
                    : 'Если активация ещё не дошла, можно вручную обновить статус или открыть биллинг и убедиться, что тариф уже переключился.'}
                </p>
              </div>

              {isConfirmed ? (
                <Link
                  href="/simulation"
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-none bg-[#171717] hover:bg-black text-white font-semibold text-sm transition-all cursor-pointer"
                >
                  Начать симуляцию
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
