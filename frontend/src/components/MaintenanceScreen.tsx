'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  LogOut,
  Settings2,
  ShieldCheck,
  TimerReset,
  Wrench,
} from 'lucide-react';
import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

export function MaintenanceScreen() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const { isSuccess: hasAdminAccess } = useQuery({
    queryKey: ['maintenance-admin-access'],
    queryFn: () => api.get('/admin/maintenance'),
    retry: false,
    staleTime: 30_000,
  });

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f1ea] px-5 py-10 sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,96,10,0.16),transparent_28%),radial-gradient(circle_at_85%_12%,rgba(17,24,39,0.12),transparent_24%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.03)_1px,transparent_1px),linear-gradient(rgba(17,24,39,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />

      <div className="relative z-10 grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative overflow-hidden border border-black/10 bg-white/88 px-6 py-7 shadow-[0_30px_80px_rgba(17,24,39,0.12)] backdrop-blur sm:px-8 sm:py-9"
        >
          <div className="absolute inset-y-0 right-0 w-48 bg-[radial-gradient(circle_at_center,rgba(232,96,10,0.18),transparent_70%)]" />

          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 border border-[rgba(232,96,10,0.16)] bg-[rgba(232,96,10,0.08)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#9a4307]">
              <Wrench size={13} />
              Service Window
            </div>

            <h1 className="mt-5 font-syne text-[42px] leading-[0.92] tracking-[-0.06em] text-neutral-950 sm:text-[58px]">
              PeakTalk временно
              <br />
              на техработах.
            </h1>

            <p className="mt-5 max-w-xl text-[16px] leading-8 text-neutral-700">
              Мы обновляем рабочий контур дашборда. Пользовательские маршруты временно закрыты, чтобы не давать вам рваный опыт и битые состояния.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-black"
              >
                <ArrowLeft size={16} />
                На главную
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-black/10 bg-white px-5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut size={16} />
                {loggingOut ? 'Выходим…' : 'Выйти из аккаунта'}
              </button>

              {hasAdminAccess ? (
                <Link
                  href="/admin"
                  className="inline-flex min-h-12 items-center justify-center gap-2 border border-[rgba(232,96,10,0.18)] bg-[rgba(232,96,10,0.08)] px-5 text-sm font-semibold text-[#9a4307] transition-colors hover:bg-[rgba(232,96,10,0.14)]"
                >
                  <Settings2 size={16} />
                  В админку
                </Link>
              ) : null}
            </div>
          </div>

          <div className="relative mt-10 flex justify-center lg:justify-start">
            <div className="relative">
              <div className="absolute inset-0 -m-5 rounded-full bg-[radial-gradient(circle,rgba(232,96,10,0.12),transparent_70%)]" />
              <div className="relative border border-black/10 bg-[#f7f4ee] px-6 py-6 shadow-[0_20px_50px_rgba(17,24,39,0.08)]">
                <video
                  className="mx-auto w-full max-w-[260px] mix-blend-multiply"
                  src="/maintenance/patience-clock.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
            </div>
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: 'easeOut' }}
          className="grid gap-4"
        >
          {[
            {
              icon: TimerReset,
              title: 'Что происходит',
              description: 'Перекрыты только пользовательские маршруты рабочего кабинета. Публичные страницы и логин продолжают жить отдельно.',
            },
            {
              icon: ShieldCheck,
              title: 'Зачем это нужно',
              description: 'Так мы не показываем частично сломанную логику и не портим данные в момент обновления продукта.',
            },
            {
              icon: Settings2,
              title: 'Для администраторов',
              description: hasAdminAccess
                ? 'Доступ в control room подтверждён. Кнопка "В админку" открывает панель, где можно выключить режим.'
                : 'Если у аккаунта есть права администратора, здесь появится прямой вход в control room.',
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="border border-black/10 bg-white/88 px-5 py-5 shadow-[0_22px_60px_rgba(17,24,39,0.08)] backdrop-blur"
              >
                <div className="flex h-11 w-11 items-center justify-center border border-black/10 bg-[rgba(17,24,39,0.03)] text-neutral-800">
                  <Icon size={18} />
                </div>
                <h2 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-neutral-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-neutral-700">{item.description}</p>
              </div>
            );
          })}
        </motion.aside>
      </div>
    </div>
  );
}
