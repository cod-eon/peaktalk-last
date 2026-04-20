'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react';

export function MaintenanceScreen() {
  return (
    <div className="relative min-h-screen overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(232,96,10,0.18),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.14),transparent_28%),linear-gradient(180deg,#fcfcfb_0%,#f4f1ec_100%)] pb-20">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(17,24,39,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(17,24,39,0.05)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.8),transparent)]" />

      <div className="relative mx-auto mt-16 flex w-full max-w-5xl flex-col px-5 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mb-6 inline-flex w-fit items-center gap-2 bg-white px-4 py-2.5 text-[11px] font-semibold tracking-[0.1em] text-neutral-800 shadow-sm shadow-black/5"
        >
          <ShieldAlert size={14} className="text-[#e8600a]" />
          ТЕХНИЧЕСКИЕ РАБОТЫ
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
          className="relative w-full overflow-hidden bg-white shadow-[0_20px_40px_rgba(0,0,0,0.04)]"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#e8600a_0%,#f59e0b_35%,#8b5cf6_100%)]" />

          <div className="p-8 sm:p-12 lg:p-16">
            <div className="flex items-center gap-2 text-[13px] font-medium text-indigo-500 mb-8">
              <Sparkles size={16} />
              Обновляем приложение и вычищаем шероховатости
            </div>

            <h1 className="font-syne text-[40px] leading-[1.05] tracking-[-0.04em] text-neutral-950 sm:text-[56px] lg:text-[72px] mb-6">
              PeakTalk скоро<br />вернётся.
            </h1>

            <p className="max-w-2xl text-[15px] leading-relaxed text-neutral-600 sm:text-[17px] mb-12">
              Сейчас дашборд временно закрыт на техработы. Это осознанная блокировка, а не случайная ошибка: чинится инфраструктура и полируется основной сценарий.
            </p>

            <div className="grid gap-4 sm:grid-cols-3 mb-10">
              <div className="border border-neutral-100 bg-neutral-50/50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-2">СТАТУС</div>
                <div className="text-[14px] font-medium text-neutral-900">Работы активны</div>
              </div>
              <div className="border border-neutral-100 bg-neutral-50/50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-2">ДОСТУП</div>
                <div className="text-[14px] font-medium text-neutral-900">Страницы дашборда скрыты</div>
              </div>
              <div className="border border-neutral-100 bg-neutral-50/50 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-2">ДЕЙСТВИЕ</div>
                <div className="text-[14px] font-medium text-neutral-900">Вернись на главный экран</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-6 border-t border-neutral-100">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-neutral-950 px-6 py-3.5 text-sm font-medium text-white transition-opacity hover:bg-neutral-800"
              >
                <ArrowLeft size={16} />
                На главный экран
              </Link>
              <div className="border border-neutral-100 px-4 py-3.5 text-[13px] text-neutral-500 sm:w-fit">
                Администратор может выключить режим в панели управления.
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="mt-12 mx-auto w-full max-w-sm"
        >
          <div className="overflow-hidden bg-[#0d0d0d] shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <video
              className="w-full object-cover"
              src="/maintenance/patience-clock.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
