'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CreditCard,
  Home,
  Loader2,
  LogOut,
  Menu,
  Network,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

const NAV_LINKS = [
  { href: '/admin', label: 'Обзор', icon: BarChart3 },
  { href: '/admin/users', label: 'Пользователи', icon: Users },
  { href: '/admin/payments', label: 'Платежи', icon: CreditCard },
  { href: '/admin/marketing-plan', label: 'Маркетинг', icon: Network },
];

function isActiveRoute(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

function AdminTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
    <header className="sticky top-0 z-50 border-b border-black/8 bg-[rgba(245,241,234,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center border border-black/10 bg-white shadow-[0_10px_24px_rgba(17,24,39,0.08)]">
              <Image src="/logo_svg.svg" alt="PeakTalk" width={28} height={28} />
            </div>
            <div>
              <div className="brand-wordmark text-[17px] text-neutral-950">PeakTalk</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500">
                Admin Control Room
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-2 border border-[rgba(232,96,10,0.16)] bg-[rgba(232,96,10,0.08)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a4307] lg:inline-flex">
            <Shield size={13} />
            Restricted Access
          </div>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const active = isActiveRoute(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-2 border px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                  active
                    ? 'border-neutral-950 bg-neutral-950 text-white'
                    : 'border-black/10 bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <Icon size={14} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-black/10 bg-white px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            <Home size={14} />
            Сайт
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 border border-black/10 bg-white px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-neutral-700 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            Выйти
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center border border-black/10 bg-white text-neutral-800 md:hidden"
          aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="border-t border-black/8 bg-[rgba(245,241,234,0.98)] px-4 py-4 md:hidden"
        >
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const active = isActiveRoute(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`inline-flex items-center justify-between border px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] ${
                    active
                      ? 'border-neutral-950 bg-neutral-950 text-white'
                      : 'border-black/10 bg-white text-neutral-700'
                  }`}
                >
                  <span>{link.label}</span>
                  <Icon size={14} />
                </Link>
              );
            })}

            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 border border-black/10 bg-white px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-neutral-700"
              >
                <Home size={14} />
                Сайт
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center justify-center gap-2 border border-black/10 bg-white px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-neutral-700"
              >
                {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                Выйти
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </header>
  );
}

function AdminAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) router.replace('/login');
        return;
      }

      try {
        await api.get('/admin/stats');
        if (!cancelled) setChecking(false);
      } catch {
        if (!cancelled) router.replace('/');
      }
    }

    void checkAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#f5f1ea]">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="flex flex-col items-center gap-4 border border-black/10 bg-white px-10 py-10 shadow-[0_24px_60px_rgba(17,24,39,0.08)]">
            <div className="flex h-12 w-12 items-center justify-center border border-black/10 bg-neutral-950 text-white">
              <Loader2 size={18} className="animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-neutral-500">
                Admin Access
              </p>
              <p className="mt-2 text-sm text-neutral-700">Проверяю права доступа и сессию.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-[#f5f1ea] text-neutral-950">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(232,96,10,0.12),transparent_28%),radial-gradient(circle_at_85%_10%,rgba(17,24,39,0.08),transparent_24%)]" />
        <div className="fixed inset-0 -z-10 bg-[linear-gradient(90deg,rgba(17,24,39,0.03)_1px,transparent_1px),linear-gradient(rgba(17,24,39,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />

        <AdminTopbar />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </AdminAuthGuard>
  );
}
