'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, Zap } from 'lucide-react';
import Link from 'next/link';
import { useBillingStore } from '@/store/billingStore';

export default function BillingCancelPage() {
  const { openUpgradeModal } = useBillingStore();

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md text-center flex flex-col items-center gap-6 bg-white border border-[var(--border-main)] rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <XCircle size={32} className="text-gray-400" />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <h1
            className="text-2xl font-bold text-[var(--text-main)]"
            style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.02em' }}
          >
            Оплата отменена
          </h1>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">
            Вы отменили процесс оплаты. Ничего не было списано с вашего счёта. Вы можете попробовать снова в любое время.
          </p>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => openUpgradeModal('simulations')}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            <Zap size={15} />
            Попробовать снова
          </button>

          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-light)] font-medium text-sm transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            Вернуться в дашборд
          </Link>
        </div>

        <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">
          Если возникли проблемы с оплатой, обратитесь в{' '}
          <a href="mailto:support@peaktalk.ru" className="underline hover:text-[var(--text-muted)]">
            поддержку
          </a>
        </p>
      </motion.div>
    </div>
  );
}
