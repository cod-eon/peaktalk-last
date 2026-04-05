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
        className="w-full max-w-md text-center flex flex-col items-center gap-6 bg-white border border-[#e5e7eb] rounded-none p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <XCircle size={32} className="text-gray-400" />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <h1
            className="text-2xl font-bold text-[#171717]"
            style={{ letterSpacing: '-0.02em' }}
          >
            Оплата отменена
          </h1>
          <p className="text-[#737373] text-sm leading-relaxed">
            Вы отменили процесс оплаты. Ничего не было списано с вашего счёта. Вы можете попробовать снова в любое время.
          </p>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => openUpgradeModal('simulations')}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-none bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
            
          >
            <Zap size={15} />
            Попробовать снова
          </button>

          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 h-11 rounded-none border border-[#e5e7eb] text-[#737373] hover:text-[#171717] hover:border-[#f3f4f6] font-medium text-sm transition-all cursor-pointer"
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
