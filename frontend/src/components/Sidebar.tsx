"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    FolderDot,
    BarChart2,
    Settings,
    Bot,
    FileText,
    LogOut,
    Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
    { name: 'Дашборд', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Проекты', path: '/projects', icon: FolderDot },
    { name: 'Документы', path: '/documents', icon: FileText },
    { name: 'Аналитика', path: '/analytics', icon: BarChart2 },
    { name: 'Симуляция', path: '/simulation', icon: Zap },
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

    return (
        <motion.aside
            initial={false}
            animate={{ width: isExpanded ? 240 : 72 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-[var(--border-main)] bg-[var(--bg-main)] z-40 overflow-hidden"
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-5 border-b border-[var(--border-main)] shrink-0 bg-[var(--bg-main)] z-10 w-full">
                <div className="flex items-center gap-3.5">
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
                                <span className="text-[15px] font-bold text-[var(--text-main)] font-syne whitespace-nowrap tracking-tight">
                                    PeakTalk
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
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
                                                isActive ? 'text-[var(--text-main)]' : ''
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
            <div className="px-2.5 pb-4 flex flex-col gap-0.5 shrink-0 bg-[var(--bg-main)] z-10 w-full border-t border-[var(--border-main)] pt-3">
                <Link
                    href="/settings"
                    title={!isExpanded ? "Настройки" : undefined}
                    className="flex items-center gap-3 px-2.5 h-9 rounded-[var(--radius-sm)] transition-all duration-150 text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-alt)] border border-transparent w-[216px]"
                >
                    <Settings size={17} strokeWidth={2} className="shrink-0" />
                    <div className="flex-1 overflow-hidden">
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.12 }}
                                    className="text-[13px] font-medium font-inter whitespace-nowrap"
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
                    className="flex items-center gap-3 px-2.5 h-9 rounded-[var(--radius-sm)] transition-all duration-150 text-[var(--text-dim)] hover:text-red-400 hover:bg-red-400/5 border border-transparent hover:border-red-400/15 w-[216px] cursor-pointer"
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
                            <div className="w-6 h-6 rounded-full bg-[var(--accent-primary-bg)] border border-[var(--accent-primary-glow)] flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-[var(--accent-primary)] font-syne">
                                    {displayName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <span className="text-[12px] text-[var(--text-dim)] font-inter truncate">
                                {displayName}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.aside>
    );
}
