'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useBillingStore } from '@/store/billingStore';

// Simple confetti-like dots rendered with CSS animation
function ConfettiDots() {
  const dots = Array.from({ length: 18 }, (_, i) => i);
  const colors = [
    'bg-accent-400', 'bg-amber-300', 'bg-accent-500',
    'bg-yellow-400', 'bg-amber-400', 'bg-accent-300',
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {dots.map((i) => (
        <motion.div
          key={i}
          className={`absolute w-2 h-2 rounded-full ${colors[i % colors.length]}`}
          initial={{
            x: '50%',
            y: '40%',
            opacity: 1,
            scale: 0,
          }}
          animate={{
            x: `${20 + Math.random() * 60}%`,
            y: `${10 + Math.random() * 50}%`,
            opacity: [1, 1, 0],
            scale: [0, 1.2, 0.8],
          }}
          transition={{
            duration: 1.2 + Math.random() * 0.8,
            delay: i * 0.04,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

export default function BillingSuccessPage() {
  const { fetchStatus } = useBillingStore();

  // Refresh billing status after successful payment
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
      <div className="relative w-full max-w-md text-center">
        <ConfettiDots />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-6 bg-white border border-[var(--border-main)] rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
        >
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-accent-100 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, duration: 0.35, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle2 size={32} className="text-accent-500" />
            </motion.div>
          </div>

          {/* Text */}
          <div className="flex flex-col gap-2">
            <h1
              className="text-2xl font-bold text-[var(--text-main)]"
              style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.02em' }}
            >
              Подписка активирована!
            </h1>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
              Добро пожаловать в PRO! Теперь вам доступны безлимитные симуляции, все персоны и PDF отчёты.
            </p>
          </div>

          {/* PRO badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-500 to-amber-400 text-white">
            <Zap size={15} />
            <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-syne)' }}>
              PeakTalk PRO активен
            </span>
          </div>

          {/* CTA */}
          <Link
            href="/simulation"
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 text-white font-semibold text-sm transition-all cursor-pointer"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            Начать симуляцию
            <ArrowRight size={15} />
          </Link>

          <Link
            href="/billing"
            className="text-[12px] text-[var(--text-dim)] hover:text-[var(--text-muted)] underline transition-colors"
          >
            Управление подпиской
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
