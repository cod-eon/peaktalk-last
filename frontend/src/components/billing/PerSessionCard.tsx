'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Zap, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
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
        ? `${window.location.origin}${returnPath ?? '/billing/success'}`
        : '';
      const res = await api.post('/billing/payment', {
        plan: 'per_session',
        return_url: returnUrl,
      });
      if (res?.payment_url) {
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
        'relative rounded-none border-2 p-6 bg-white transition-all',
        highlighted
          ? 'border-neutral-900 animate-pulse-border'
          : 'border-neutral-900',
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

      <p className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 mb-4">
        Нужна одна подготовка?
      </p>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-4xl font-extrabold text-neutral-900 tracking-tight">299 ₽</span>
        <span className="text-sm text-neutral-500 font-medium">разово</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4 mb-6 text-sm text-neutral-600">
        <span className="flex items-center gap-1.5">
          <Zap size={13} className="text-neutral-500" />
          1 полная сессия
        </span>
        <span className="w-px h-3.5 bg-neutral-200" />
        <span className="flex items-center gap-1.5">
          <FileText size={13} className="text-neutral-500" />
          PDF-отчёт
        </span>
        <span className="w-px h-3.5 bg-neutral-200" />
        <span className="flex items-center gap-1.5">
          <FileText size={13} className="text-neutral-500" />
          Шпаргалка
        </span>
      </div>

      <button
        onClick={handleBuy}
        className="w-full h-12 bg-neutral-900 hover:bg-black text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-none"
      >
        Начать сессию за 299 ₽
        <ArrowRight size={15} />
      </button>

      <p className="text-[11px] text-neutral-400 mt-3 text-center">
        Без подписки. Оплата один раз.
      </p>
    </motion.div>
  );
}
