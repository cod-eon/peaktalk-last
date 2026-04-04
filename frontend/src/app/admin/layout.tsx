'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  BarChart3,
  Users,
  CreditCard,
  LogOut,
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
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 flex items-center justify-center">
              <Image src="/logo_svg.svg" alt="PeakTalk" width={28} height={28} />
            </div>
            <span className="font-inter font-extrabold text-[15px] tracking-[-0.02em] text-neutral-900">
              PeakTalk <span className="text-neutral-900">Admin</span>
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
                      ? 'bg-neutral-100 text-neutral-900'
                      : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'
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
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-400 text-[13px] font-medium hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              Выйти
            </button>
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors cursor-pointer"
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
          className="md:hidden border-t border-neutral-200 bg-white px-4 py-3 flex flex-col gap-1"
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
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'
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
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14px] font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer mt-1 border-t border-neutral-200 pt-3"
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
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
      <div className="min-h-screen bg-white bg-page-geo-subtle">
        <AdminNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AdminAuthGuard>
  );
}
