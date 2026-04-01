"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Settings,
    Bot,
    FileText,
    LogOut,
    CreditCard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { useBillingStore } from '@/store/billingStore';
import { PlanBadge } from '@/components/PlanBadge';

const NAV_ITEMS = [
    { name: 'Дашборд', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Мои тексты', path: '/documents', icon: FileText },
    { name: 'Симуляции', path: '/simulation', icon: Bot },
    { name: 'Подписка', path: '/billing', icon: CreditCard },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const { user } = useAuthStore();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Пользователь';
    const billingStatus = useBillingStore((s) => s.status);
    const currentPlan = billingStatus?.subscription.plan ?? 'starter';

    return (
        <motion.aside
            initial={false}
            animate={{ width: isExpanded ? 240 : 72 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-[var(--border-main)] bg-[var(--bg-surface)] z-40 overflow-hidden"
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-5 border-b border-[var(--border-main)] shrink-0 bg-[var(--bg-surface)] z-10 w-full">
                <Link href="/" className="flex items-center gap-3.5 hover:opacity-75 transition-opacity">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <Image src="/logo_svg.svg" alt="PeakTalk" width={32} height={32} />
                    </div>
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -6 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                            >
                                <span className="whitespace-nowrap text-[var(--text-main)]" style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>
                                    PeakTalk
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2.5 w-full">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            title={!isExpanded ? item.name : undefined}
                            className={`
                                flex items-center gap-3 px-2.5 h-9 rounded-[var(--radius-sm)] transition-all duration-150 relative group w-[216px] border
                                ${isActive
                                    ? 'sidebar-item-active text-[var(--accent-primary)]'
                                    : 'text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-alt)] border-transparent'
                                }
                            `}
                        >
                            <item.icon
                                size={17}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={`shrink-0 transition-colors ${
                                    isActive
                                        ? 'text-[var(--accent-primary)]'
                                        : 'text-[var(--text-dim)] group-hover:text-[var(--text-muted)]'
                                }`}
                            />
                            <div className="flex-1 overflow-hidden">
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.12 }}
                                            className={`text-[13px] font-medium whitespace-nowrap font-inter ${
                                                isActive ? 'text-[var(--accent-primary)]' : ''
                                            }`}
                                        >
                                            {item.name}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom — settings + user */}
            <div className="px-2.5 pb-4 flex flex-col gap-0.5 shrink-0 bg-[var(--bg-surface)] z-10 w-full border-t border-[var(--border-main)] pt-3">
                <Link
                    href="/settings"
                    title={!isExpanded ? "Настройки" : undefined}
                    className={`flex items-center gap-3 px-2.5 h-9 rounded-[var(--radius-sm)] transition-all duration-150 border w-[216px] ${
                        pathname === '/settings' || pathname?.startsWith('/settings/')
                            ? 'sidebar-item-active text-[var(--accent-primary)]'
                            : 'text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-alt)] border-transparent'
                    }`}
                >
                    <Settings
                        size={17}
                        strokeWidth={pathname === '/settings' ? 2.5 : 2}
                        className={`shrink-0 ${pathname === '/settings' ? 'text-[var(--accent-primary)]' : ''}`}
                    />
                    <div className="flex-1 overflow-hidden">
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.12 }}
                                    className={`text-[13px] font-medium font-inter whitespace-nowrap ${
                                        pathname === '/settings' ? 'text-[var(--accent-primary)]' : ''
                                    }`}
                                >
                                    Настройки
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </Link>

                <button
                    onClick={handleLogout}
                    title={!isExpanded ? "Выйти" : undefined}
                    className="flex items-center gap-3 px-2.5 h-9 rounded-[var(--radius-sm)] transition-all duration-150 text-[var(--text-dim)] hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 w-[216px] cursor-pointer"
                >
                    <LogOut size={17} strokeWidth={2} className="shrink-0" />
                    <div className="flex-1 overflow-hidden flex justify-start">
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.12 }}
                                    className="text-[13px] font-medium font-inter whitespace-nowrap"
                                >
                                    Выйти
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </button>

                {/* User chip at very bottom */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="mt-2 px-2.5 py-2 flex items-center gap-2.5 border-t border-[var(--border-main)]"
                        >
                            <div className="w-6 h-6 rounded-full bg-accent-100 border border-accent-200 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-accent-500">
                                    {displayName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                <span className="text-[12px] text-[var(--text-dim)] font-inter truncate leading-none">
                                    {displayName}
                                </span>
                                <PlanBadge plan={currentPlan} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.aside>
    );
}
