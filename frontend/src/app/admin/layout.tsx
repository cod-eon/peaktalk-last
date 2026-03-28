'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  CreditCard,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

const NAV_LINKS = [
  { href: '/admin', label: 'Статистика', icon: BarChart3 },
  { href: '/admin/users', label: 'Пользователи', icon: Users },
  { href: '/admin/payments', label: 'Платежи', icon: CreditCard },
];

function AdminNavbar() {
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
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-[var(--z-topbar)] bg-[var(--bg-surface)] border-b border-[var(--border-main)] shadow-[var(--shadow-card)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center">
              <ShieldCheck size={14} className="text-white" />
            </div>
            <span
              className="text-[15px] font-bold text-[var(--text-main)] tracking-tight"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              PeakTalk <span className="text-[var(--accent-primary)]">Admin</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--accent-primary-bg)] text-[var(--accent-primary)]'
                      : 'text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-alt)]'
                  }`}
                >
                  <Icon size={15} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-main)] text-[var(--text-dim)] text-[13px] font-medium hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              Выйти
            </button>
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-[var(--bg-surface-alt)] text-[var(--text-dim)] transition-colors cursor-pointer"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Меню"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="md:hidden border-t border-[var(--border-main)] bg-[var(--bg-surface)] px-4 py-3 flex flex-col gap-1"
        >
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--accent-primary-bg)] text-[var(--accent-primary)]'
                    : 'text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-alt)]'
                }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer mt-1 border-t border-[var(--border-main)] pt-3"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </motion.div>
      )}
    </header>
  );
}

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // Wait for Supabase session before hitting the API
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

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

    check();
    return () => { cancelled = true; };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[var(--text-dim)]">
          <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Проверка доступа...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-[var(--bg-main)] bg-page-geo-subtle">
        <AdminNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AdminAuthGuard>
  );
}
