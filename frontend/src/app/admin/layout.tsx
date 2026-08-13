'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Loader2, LogOut, Menu, ShieldCheck, Users, X, LayoutDashboard, KeyRound } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { api, ApiError } from '@/lib/api';

const NAV_LINKS = [
  { href: '/admin', label: 'Обзор', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Пользователи', icon: Users },
  { href: '/admin/auth', label: 'Доступ и auth', icon: KeyRound },
];

function isActiveRoute(pathname: string, href: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Разделы админ-панели" className="flex flex-col gap-1 md:flex-row md:items-center">
      {NAV_LINKS.map((link) => {
        const Icon = link.icon;
        const active = isActiveRoute(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex min-h-10 items-center gap-2 border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] ${active ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-transparent text-neutral-700 hover:border-black/10 hover:bg-white'}`}
          >
            <Icon size={15} aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AdminTopbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authClient.signOut();
    } finally {
      window.location.assign('/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[rgba(250,248,244,0.96)] backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]">
            <span className="flex h-9 w-9 items-center justify-center border border-black/10 bg-white">
              <Image src="/logo_svg.svg" alt="PeakTalk" width={24} height={24} />
            </span>
            <span className="hidden sm:block">
              <span className="brand-wordmark block text-[15px] text-neutral-950">PeakTalk</span>
              <span className="font-mono block text-[9px] uppercase tracking-[0.16em] text-neutral-500">Admin</span>
            </span>
          </Link>
          <span className="hidden items-center gap-1.5 border-l border-black/10 pl-3 text-xs text-neutral-500 lg:flex">
            <ShieldCheck size={14} className="text-emerald-700" aria-hidden="true" />
            Закрытый контур
          </span>
        </div>

        <div className="hidden md:block"><AdminNav /></div>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/" className="inline-flex min-h-10 items-center gap-2 border border-black/10 bg-white px-3 text-sm text-neutral-700 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]">
            <Home size={15} aria-hidden="true" /> Сайт
          </Link>
          <button type="button" onClick={handleLogout} disabled={loggingOut} className="inline-flex min-h-10 items-center gap-2 border border-black/10 bg-white px-3 text-sm text-neutral-700 hover:bg-red-50 hover:text-red-700 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]">
            {loggingOut ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <LogOut size={15} aria-hidden="true" />} Выйти
          </button>
        </div>

        <button type="button" onClick={() => setMobileOpen((value) => !value)} className="inline-flex h-10 w-10 items-center justify-center border border-black/10 bg-white text-neutral-800 md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]" aria-label={mobileOpen ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={mobileOpen}>
          {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-black/10 bg-[rgba(250,248,244,0.99)] px-4 py-3 md:hidden">
          <AdminNav onNavigate={() => setMobileOpen(false)} />
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-black/10 pt-3">
            <Link href="/" onClick={() => setMobileOpen(false)} className="inline-flex min-h-10 items-center justify-center gap-2 border border-black/10 bg-white px-3 text-sm text-neutral-700"><Home size={15} aria-hidden="true" /> Сайт</Link>
            <button type="button" onClick={handleLogout} disabled={loggingOut} className="inline-flex min-h-10 items-center justify-center gap-2 border border-black/10 bg-white px-3 text-sm text-neutral-700 disabled:opacity-60">{loggingOut ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <LogOut size={15} aria-hidden="true" />} Выйти</button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function AdminAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'ready' | 'denied' | 'error'>('checking');

  useEffect(() => {
    let cancelled = false;
    async function checkAccess() {
      try {
        await api.get('/admin/control/overview');
        if (!cancelled) setState('ready');
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 403) {
          setState('denied');
          router.replace('/unauthorized?from=%2Fadmin');
        } else if (error instanceof ApiError && error.status === 401) {
          router.replace('/login?return=%2Fadmin');
        } else {
          setState('error');
        }
      }
    }
    void checkAccess();
    return () => { cancelled = true; };
  }, [router]);

  if (state === 'error') {
    return <div className="grid min-h-screen place-items-center bg-[var(--landing-paper)] px-5"><div className="max-w-md border border-red-200 bg-white p-6 text-center" role="alert"><h1 className="text-lg font-semibold">Админ-панель недоступна</h1><p className="mt-2 text-sm leading-6 text-neutral-600">Сервис авторизации не ответил. Обновите страницу или повторите позже.</p><button type="button" onClick={() => window.location.reload()} className="mt-5 min-h-10 border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white">Повторить</button></div></div>;
  }

  if (state !== 'ready') {
    return <div className="grid min-h-screen place-items-center bg-[var(--landing-paper)] px-5" aria-live="polite"><div className="flex items-center gap-3 border border-black/10 bg-white px-5 py-4 text-sm text-neutral-700"><Loader2 size={16} className="animate-spin" aria-hidden="true" />Проверяю права доступа…</div></div>;
  }

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-[var(--landing-paper)] text-neutral-950">
        <AdminTopbar />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </AdminAuthGuard>
  );
}
