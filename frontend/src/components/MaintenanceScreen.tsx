'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react';

export function MaintenanceScreen() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(232,96,10,0.18),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.14),transparent_28%),linear-gradient(180deg,#fcfcfb_0%,#f4f1ec_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(17,24,39,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(17,24,39,0.05)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.8),transparent)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-5 py-10 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mb-6 inline-flex w-fit items-center gap-2 border border-black/10 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-700 backdrop-blur"
        >
          <ShieldAlert size={14} className="text-[var(--accent-primary)]" />
          Технические работы
        </motion.div>

        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr,0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
            className="relative overflow-hidden border border-black/10 bg-white/85 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#e8600a_0%,#f59e0b_35%,#8b5cf6_100%)]" />

            <div className="mb-6 flex items-center gap-2 text-[12px] font-medium text-neutral-500">
              <Sparkles size={14} className="text-[var(--color-ai)]" />
              Обновляем приложение и вычищаем шероховатости
            </div>

            <h1 className="max-w-[11ch] font-syne text-[46px] leading-[0.92] tracking-[-0.06em] text-neutral-950 sm:text-[64px]">
              PeakTalk скоро вернётся.
            </h1>

            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-neutral-600 sm:text-[17px]">
              Сейчас дашборд временно закрыт на техработы. Это осознанная блокировка, а не случайная ошибка:
              чинится инфраструктура и полируется основной сценарий.
            </p>

            <div className="mt-8 inline-flex items-center gap-2.5 border border-black/8 bg-[#faf7f2] px-4 py-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-primary)]" />
              <span className="text-[13px] font-medium text-neutral-800">Работы активны</span>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                <ArrowLeft size={16} />
                На главный экран
              </Link>
              <span className="text-[13px] text-neutral-400">
                Администратор может выключить режим в панели управления.
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
            className="relative mx-auto w-full max-w-[320px]"
          >
            <video
              className="w-full rounded-lg shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
              src="/maintenance/patience-clock.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
