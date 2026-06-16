'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { toast } from 'sonner';

interface PerSessionCardProps {
  highlighted?: boolean;
  returnPath?: string;
}

export function PerSessionCard({ highlighted = false, returnPath }: PerSessionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlighted]);

  const handleBuy = async () => {
    try {
      const returnUrl = typeof window !== 'undefined'
        ? `${window.location.origin}${returnPath ? `/billing/success?return=${encodeURIComponent(returnPath)}` : '/billing/success'}`
        : '';
      const res = await api.post('/billing/payment', {
        plan: 'per_session',
        return_url: returnUrl,
      });
      if (res?.payment_url) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('peaktalk_payment_context', JSON.stringify({
            payment_id: res.payment_id ?? null,
            payment_plan: 'per_session',
            return_path: returnPath ?? '/billing/success',
            plan_context: 'meeting_defense_pack',
          }));
        }
        trackEvent('payment_started', {
          source: returnPath === '/simulation/from-guest' ? 'guest_paywall' : 'billing',
          payment_plan: 'per_session',
          payment_id: res.payment_id ?? null,
          return_path: returnPath ?? '/billing/success',
          plan_context: 'meeting_defense_pack',
        });
        window.location.href = res.payment_url;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка оплаты';
      toast.error(message);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={[
        'relative rounded-none border border-[#111827] p-5 sm:p-6 bg-[#111827] text-white transition-all min-h-full flex flex-col',
        highlighted
          ? 'animate-pulse-border'
          : '',
      ].join(' ')}
    >
      {highlighted && (
        <style>{`
          @keyframes pulse-border {
            0%, 100% { border-color: #171717; box-shadow: 0 0 0 0 rgba(23,23,23,0.15); }
            50% { border-color: #525252; box-shadow: 0 0 0 6px rgba(23,23,23,0); }
          }
          .animate-pulse-border {
            animation: pulse-border 1.8s ease-in-out 3;
          }
        `}</style>
      )}

      <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-white/55 mb-4 font-mono">
        Разовая подготовка
      </p>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-5xl font-black text-white tracking-tight">299 ₽</span>
        <span className="text-sm text-white/55 font-medium">разово</span>
      </div>

      <div className="grid grid-cols-1 gap-3 mt-5 mb-6 text-sm text-white/75">
        <span className="flex items-center gap-1.5">
          <Zap size={13} className="text-[#E8600A]" />
          1 полная сессия
        </span>
        <span className="flex items-center gap-1.5">
          <FileText size={13} className="text-[#E8600A]" />
          PDF-отчёт
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-[#E8600A]" />
          Шпаргалка
        </span>
      </div>

      <button
        onClick={handleBuy}
        className="mt-auto w-full h-12 bg-white hover:bg-[#FAF8F4] text-[#111827] font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-none"
      >
        Начать сессию за 299 ₽
        <ArrowRight size={15} />
      </button>

      <p className="text-[11px] text-white/45 mt-3 text-center">
        Без подписки. Оплата один раз.
      </p>
    </motion.div>
  );
}
