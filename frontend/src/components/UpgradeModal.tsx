'use client';

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Check, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { UpgradeReason } from '@/types/billing';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: UpgradeReason | null;
}

const REASON_CONFIG: Record<
  UpgradeReason,
  { title: string; subtitle: string }
> = {
  simulations: {
    title: 'Лимит симуляций исчерпан',
    subtitle: 'Вы использовали все бесплатные симуляции этого месяца.',
  },
  documents: {
    title: 'Лимит документов исчерпан',
    subtitle: 'Бесплатный план позволяет хранить до 3 документов.',
  },
  personas: {
    title: 'Персона доступна в PRO',
    subtitle: 'Эта персона открыта только в плане PRO.',
  },
  pdf: {
    title: 'PDF-отчёты — только в PRO',
    subtitle: 'Экспорт детального отчёта доступен в плане PRO.',
  },
};

const PRO_FEATURES = [
  'Безлимитные симуляции каждый месяц',
  'Безлимитное хранилище документов',
  'Все 15+ персон, включая эксклюзивные',
  'PDF-экспорт отчётов о сессиях',
  'Приоритетная поддержка',
];

export function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const config = reason ? REASON_CONFIG[reason] : REASON_CONFIG.simulations;

  const handleUpgrade = useCallback(async () => {
    try {
      const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/billing/success` : '';
      const res = await api.post('/billing/payment', {
        plan: 'pro',
        return_url: returnUrl,
      });
      if (res?.payment_url) {
        window.location.href = res.payment_url;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка оплаты';
      toast.error(message);
    }
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-sm bg-white border border-neutral-200 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-5 border-b border-neutral-100">
                <button
                  onClick={onClose}
                  className="absolute top-5 right-5 w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  aria-label="Закрыть"
                >
                  <X size={15} />
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-neutral-900 flex items-center justify-center shrink-0">
                    <Zap size={15} className="text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-0.5">
                      Перейти на PRO
                    </div>
                    <h2 className="text-neutral-900 font-inter font-bold text-base leading-tight">
                      {config.title}
                    </h2>
                  </div>
                </div>
                <p className="text-neutral-500 text-sm leading-relaxed pl-11">
                  {config.subtitle}
                </p>
              </div>

              {/* Features */}
              <div className="px-6 py-5">
                <p className="text-[11px] font-bold tracking-widest uppercase text-neutral-400 mb-3">
                  Что вы получите
                </p>
                <ul className="space-y-2.5">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 mt-0.5 shrink-0 bg-neutral-900 flex items-center justify-center">
                        <Check size={9} className="text-white" />
                      </div>
                      <span className="text-sm text-neutral-700 leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="px-6 pb-6">
                <button
                  onClick={handleUpgrade}
                  className="w-full h-12 bg-neutral-900 hover:bg-black text-white font-inter font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  Перейти на PRO — 990 ₽/мес
                  <ArrowRight size={15} />
                </button>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] text-neutral-400">Текущий план: Starter — Бесплатно</span>
                  <span className="text-[11px] text-neutral-400">Отмена в любой момент</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
