'use client';

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Check, Infinity } from 'lucide-react';
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
    subtitle:
      'Вы использовали все 3 бесплатные симуляции этого месяца. Перейдите на PRO — тренируйтесь без ограничений.',
  },
  documents: {
    title: 'Лимит документов исчерпан',
    subtitle:
      'Бесплатный план позволяет хранить до 3 документов. Перейдите на PRO для неограниченного количества документов.',
  },
  personas: {
    title: 'Персона доступна в PRO',
    subtitle:
      'Эта персона доступна только в плане PRO. Откройте все 15+ персон — от венчурных инвесторов до журналистов.',
  },
  pdf: {
    title: 'PDF отчёты — только в PRO',
    subtitle:
      'Экспорт детального отчёта в PDF доступен в плане PRO. Анализируйте прогресс и делитесь результатами.',
  },
};

const STARTER_FEATURES = [
  '3 симуляции в месяц',
  '3 документа',
  '3 базовые персоны',
  'Нет PDF отчётов',
];

const PRO_FEATURES = [
  'Безлимитные симуляции',
  'Безлимитные документы',
  'Все 15+ персон',
  'PDF отчёты',
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

          {/* Modal card */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4">
                <button
                  onClick={onClose}
                  className="absolute top-5 right-5 w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-alt)] transition-colors"
                  aria-label="Закрыть"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-accent-100 flex items-center justify-center">
                    <Zap size={18} className="text-accent-500" />
                  </div>
                  <div>
                    <h2
                      className="text-[var(--text-main)] font-semibold text-base leading-tight"
                      style={{ fontFamily: 'var(--font-syne)' }}
                    >
                      {config.title}
                    </h2>
                  </div>
                </div>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                  {config.subtitle}
                </p>
              </div>

              {/* Plan comparison */}
              <div className="px-6 pb-4 grid grid-cols-2 gap-3">
                {/* Starter card */}
                <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-4">
                  <div className="mb-3">
                    <span className="inline-block text-[10px] font-semibold tracking-widest text-[var(--text-dim)] uppercase mb-1">
                      Текущий
                    </span>
                    <div
                      className="text-[var(--text-main)] font-bold text-sm"
                      style={{ fontFamily: 'var(--font-syne)' }}
                    >
                      STARTER
                    </div>
                    <div className="text-[var(--text-dim)] text-[11px] mt-0.5">Бесплатно</div>
                  </div>
                  <ul className="space-y-1.5">
                    {STARTER_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-[11px] text-[var(--text-muted)]">
                        <span className="w-3 h-3 mt-0.5 shrink-0 text-[var(--text-dim)]">—</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pro card */}
                <div className="rounded-xl border-2 border-accent-400 bg-gradient-to-b from-accent-50/60 to-amber-50/30 p-4 relative overflow-hidden">
                  <div className="absolute top-2 right-2">
                    <span className="text-[9px] font-bold tracking-widest text-accent-500 bg-accent-100 px-1.5 py-0.5 rounded-full uppercase">
                      Выбрать
                    </span>
                  </div>
                  <div className="mb-3">
                    <span className="inline-block text-[10px] font-semibold tracking-widest text-accent-500 uppercase mb-1">
                      Рекомендуем
                    </span>
                    <div
                      className="text-[var(--text-main)] font-bold text-sm"
                      style={{ fontFamily: 'var(--font-syne)' }}
                    >
                      PRO
                    </div>
                    <div className="text-accent-600 text-[11px] font-semibold mt-0.5">990 ₽/мес</div>
                  </div>
                  <ul className="space-y-1.5">
                    {PRO_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-[11px] text-[var(--text-main)]">
                        <Check size={10} className="mt-0.5 shrink-0 text-accent-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CTA */}
              <div className="px-6 pb-6">
                <button
                  onClick={handleUpgrade}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-accent-500 to-amber-500 hover:from-accent-600 hover:to-amber-600 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  style={{ fontFamily: 'var(--font-syne)' }}
                >
                  <Infinity size={16} />
                  Перейти на PRO — 990 ₽/мес
                </button>
                <p className="text-center text-[11px] text-[var(--text-dim)] mt-2.5">
                  Отменить можно в любой момент без условий
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
