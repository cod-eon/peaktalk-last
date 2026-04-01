'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X } from 'lucide-react';
import { useBillingStore } from '@/store/billingStore';

const DISMISS_KEY = 'peaktalk_upgrade_banner_dismissed';

function getDismissedAt(): number | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(DISMISS_KEY);
  return v ? parseInt(v, 10) : null;
}

function isDismissed(): boolean {
  const at = getDismissedAt();
  if (!at) return false;
  // Dismiss for 24 hours
  return Date.now() - at < 24 * 60 * 60 * 1000;
}

export function UpgradeBanner() {
  const { status, openUpgradeModal } = useBillingStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!status) return;
    const plan = status.subscription.plan;
    if (plan !== 'starter') return;

    const used = status.usage.simulations_used;
    const limit = status.limits.simulations_per_month;
    if (limit === null) return;

    const shouldShow = used >= 2 && !isDismissed();
    setVisible(shouldShow);
  }, [status]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setVisible(false);
  };

  const handleUpgrade = () => {
    openUpgradeModal('simulations');
  };

  if (!status || status.subscription.plan !== 'starter') return null;

  const used = status.usage.simulations_used;
  const limit = status.limits.simulations_per_month ?? 3;
  const left = Math.max(0, limit - used);

  const bannerText =
    left === 0
      ? 'Лимит симуляций исчерпан — нужен PRO для продолжения'
      : `Осталась ${left} симуляция — переходи на PRO для безлимита`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full bg-gradient-to-r from-accent-500 to-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 z-30"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Zap size={14} className="shrink-0" />
            <span className="text-[13px] font-medium truncate">{bannerText}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleUpgrade}
              className="text-[12px] font-semibold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Апгрейд →
            </button>
            <button
              onClick={handleDismiss}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              aria-label="Закрыть баннер"
            >
              <X size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
