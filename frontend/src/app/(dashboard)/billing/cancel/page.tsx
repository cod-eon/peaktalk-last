'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useBillingStore } from '@/store/billingStore';

export default function BillingCancelPage() {
  const { openUpgradeModal } = useBillingStore();

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-6 font-inter">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md text-center flex flex-col items-center gap-6 bg-white border border-[#D9D5CC] rounded-none p-8"
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-none bg-[#FAF8F4] border border-[#D9D5CC] flex items-center justify-center">
          <XCircle size={28} className="text-[#73706A]" />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <h1
            className="text-2xl font-black text-[#111827]"
            style={{ letterSpacing: '-0.02em' }}
          >
            Оплата отменена
          </h1>
          <p className="text-[#73706A] text-sm leading-relaxed">
            Вы отменили процесс оплаты. Ничего не было списано с вашего счёта. Вы можете попробовать снова в любое время.
          </p>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => openUpgradeModal('simulations')}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-none bg-[#111827] hover:bg-black text-white font-semibold text-sm transition-colors cursor-pointer"
            
          >
            <RefreshCcw size={15} />
            Попробовать снова
          </button>

          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 h-11 rounded-none border border-[#D9D5CC] text-[#73706A] hover:text-[#111827] hover:border-[#111827] font-medium text-sm transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            Вернуться в дашборд
          </Link>
        </div>

        <p className="text-[11px] text-[#737373] leading-relaxed">
          Если возникли проблемы с оплатой, обратитесь в{' '}
          <a href="mailto:support@peaktalk.ru" className="underline hover:text-[#737373]">
            поддержку
          </a>
        </p>
      </motion.div>
    </div>
  );
}
