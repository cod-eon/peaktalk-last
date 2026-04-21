'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Wrench } from 'lucide-react';

export function MaintenanceScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f7f5]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,96,10,0.18),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.14),transparent_28%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="relative mb-10">
            <div className="absolute inset-0 -m-6 rounded-full bg-[radial-gradient(circle,rgba(232,96,10,0.08),transparent_70%)]" />
            <video
              className="relative mx-auto w-full max-w-[280px] mix-blend-screen"
              src="/maintenance/patience-clock.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="mb-3 inline-flex items-center gap-2 rounded-none border border-amber-200/60 bg-amber-50/80 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-amber-700"
        >
          <Wrench size={12} />
          ТЕХНИЧЕСКИЕ РАБОТЫ
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="mb-4 font-syne text-[32px] leading-tight tracking-[-0.03em] text-neutral-900 sm:text-[40px]"
        >
          PeakTalk скоро&nbsp;вернётся
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          className="mb-8 max-w-sm text-[15px] leading-relaxed text-neutral-500"
        >
          Дашборд временно закрыт на техработы.
          Обновляем инфраструктуру и полируем основной сценарий.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-none bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            <ArrowLeft size={15} />
            На главную
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
