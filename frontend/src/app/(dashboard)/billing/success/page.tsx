'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Clock3, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useBillingStore } from '@/store/billingStore';

export default function BillingSuccessPage() {
  const { fetchStatus, status, isLoading } = useBillingStore();

  const isPaidPlan = status?.subscription.plan === 'pro' || status?.subscription.plan === 'team';
  const isConfirmed = Boolean(isPaidPlan && status?.subscription.status === 'active');

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
      <div className="relative w-full max-w-md text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-6 bg-white border border-[#e5e7eb] rounded-none p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isConfirmed ? 'bg-accent-100' : 'bg-amber-100'}`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, duration: 0.35, type: 'spring', stiffness: 200 }}
            >
              {isConfirmed ? (
                <CheckCircle2 size={32} className="text-accent-500" />
              ) : (
                <Clock3 size={32} className="text-amber-500" />
              )}
            </motion.div>
          </div>

          <div className="flex flex-col gap-2">
            <h1
              className="text-2xl font-bold text-[#171717]"
              style={{ letterSpacing: '-0.02em' }}
            >
              {isConfirmed ? 'Подписка активирована' : 'Платёж получен, проверяем активацию'}
            </h1>
            <p className="text-[#737373] text-sm leading-relaxed">
              {isConfirmed
                ? 'Тариф уже подтверждён в биллинге. Можно возвращаться к симуляциям.'
                : 'Страница оплаты вернула успешный статус, но биллинг ещё не подтвердил активацию. Обычно это занимает несколько секунд после webhook YooKassa.'}
            </p>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-none text-sm font-semibold ${isConfirmed ? 'bg-[#ecfdf3] text-[#166534] border border-[#bbf7d0]' : 'bg-[#fff7ed] text-[#9a3412] border border-[#fed7aa]'}`}>
            {isConfirmed ? (
              <>
                <CheckCircle2 size={15} />
                <span>Активация подтверждена в биллинге</span>
              </>
            ) : (
              <>
                <RefreshCcw size={15} className={isLoading ? 'animate-spin' : ''} />
                <span>{isLoading ? 'Проверяем статус подписки' : 'Ожидаем подтверждение webhook'}</span>
              </>
            )}
          </div>

          {isConfirmed ? (
            <Link
              href="/simulation"
              className="w-full flex items-center justify-center gap-2 h-11 rounded-none bg-[#E8600A] hover:opacity-90 text-white font-semibold text-sm transition-all cursor-pointer"
            >
              Начать симуляцию
              <ArrowRight size={15} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => void fetchStatus()}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-none bg-[#171717] hover:opacity-90 text-white font-semibold text-sm transition-all cursor-pointer disabled:opacity-60"
              disabled={isLoading}
            >
              Проверить статус ещё раз
              <RefreshCcw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}

          <Link
            href="/billing"
            className="text-[12px] text-[#737373] hover:text-[#737373] underline transition-colors"
          >
            Управление подпиской
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
