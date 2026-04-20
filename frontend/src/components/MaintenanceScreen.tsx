'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings } from 'lucide-react';

export function MaintenanceScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf9f7] px-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="border border-black/8 bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="mb-5 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            <Settings size={13} className="animate-spin" style={{ animationDuration: '3s' }} />
            Технические работы
          </div>

          <h1 className="font-syne text-[28px] leading-[1.1] tracking-[-0.04em] text-neutral-950 sm:text-[32px]">
            PeakTalk скоро вернётся
          </h1>

          <p className="mt-3 text-[14px] leading-6 text-neutral-500">
            Дашборд временно закрыт на обновление. Это осознанная блокировка — чиним инфраструктуру и полируем основной сценарий.
          </p>

          <div className="mt-6 border-t border-black/6 pt-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-neutral-950 px-4 py-2.5 text-[13px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
            >
              <ArrowLeft size={15} />
              На главный экран
            </Link>
          </div>

          <p className="mt-4 text-[12px] text-neutral-400">
            Администратор может выключить режим в панели управления.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
