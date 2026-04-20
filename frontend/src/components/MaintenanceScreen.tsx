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

        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr,0.95fr]">
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

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="border border-black/8 bg-[#faf7f2] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Статус</div>
                <div className="mt-2 text-sm font-medium text-neutral-900">Работы активны</div>
              </div>
              <div className="border border-black/8 bg-white p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Доступ</div>
                <div className="mt-2 text-sm font-medium text-neutral-900">Страницы дашборда скрыты</div>
              </div>
              <div className="border border-black/8 bg-white p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Действие</div>
                <div className="mt-2 text-sm font-medium text-neutral-900">Вернись на главный экран</div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                <ArrowLeft size={16} />
                На главный экран
              </Link>
              <div className="border border-black/10 bg-white px-4 py-3 text-sm text-neutral-500">
                Администратор может выключить режим в панели управления.
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
            className="relative overflow-hidden border border-black/10 bg-[#171717] p-3 shadow-[0_30px_80px_rgba(23,23,23,0.25)]"
          >
            <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/70">
              <span>Maintenance Loop</span>
              <span>PeakTalk</span>
            </div>
            <video
              className="aspect-[4/5] w-full object-cover"
              src="/maintenance/patience-clock.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
