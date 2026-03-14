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
    LogOut
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
    { name: 'Симуляция', path: '/simulation', icon: Bot },
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
    const firstLetter = displayName.charAt(0).toUpperCase();

    return (
        <motion.aside
            initial={false}
            animate={{ width: isExpanded ? 240 : 72 }}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-[var(--border-main)] bg-[var(--bg-main)] z-40 transition-all duration-300 overflow-hidden"
        >
            {/* Logo Area */}
            <div className="h-16 flex items-center px-5 border-b border-[var(--border-main)] shrink-0 bg-[var(--bg-main)] z-10 w-full">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <Image src="/logo_svg.svg" alt="PeakTalk Logo" width={32} height={32} />
                    </div>
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="text-lg font-bold text-[var(--text-main)] font-syne whitespace-nowrap overflow-hidden"
                            >
                                PeakTalk
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 flex flex-col gap-2 overflow-y-auto overflow-x-hidden px-3 w-full">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            title={!isExpanded ? item.name : undefined}
                            className={`
                                flex items-center gap-4 px-3 h-10 rounded-md transition-colors relative group w-[216px]
                                ${isActive
                                    ? 'text-[var(--text-main)] bg-[var(--bg-surface)] border border-[var(--border-main)]'
                                    : 'text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-alt)] border border-transparent'
                                }
                            `}
                        >
                            <item.icon
                                size={18}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={`shrink-0 ${isActive ? 'text-[var(--text-main)]' : 'group-hover:text-[var(--text-main)] text-[var(--text-muted)]'}`}
                            />
                            <div className="flex-1 overflow-hidden">
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="font-mono text-[11px] uppercase tracking-wider whitespace-nowrap"
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

            {/* User Profile / Bottom */}
            <div className="p-3 border-t border-[var(--border-main)] flex flex-col gap-2 shrink-0 bg-[var(--bg-main)] z-10 w-full">
                <Link
                    href="/settings"
                    title={!isExpanded ? "Настройки" : undefined}
                    className="flex items-center gap-4 px-3 h-10 rounded-md transition-colors relative group text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-alt)] border border-transparent w-[216px]"
                >
                    <Settings
                        size={18}
                        strokeWidth={2}
                        className="shrink-0 group-hover:text-[var(--text-main)] text-[var(--text-muted)]"
                    />
                    <div className="flex-1 overflow-hidden">
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="font-mono text-[11px] uppercase tracking-wider whitespace-nowrap"
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
                    className="flex items-center gap-4 px-3 h-10 rounded-md transition-colors relative group text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-alt)] border border-transparent w-[216px] overflow-hidden"
                >
                    <div className="w-[18px] h-[18px] shrink-0 group-hover:hidden text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
                      <div className="w-5 h-5 -ml-0.5 -mt-0.5 rounded-md bg-[var(--text-main)] text-[var(--bg-main)] flex items-center justify-center font-bold text-[10px] font-syne uppercase">
                          {firstLetter}
                      </div>
                    </div>
                    <LogOut
                        size={18}
                        strokeWidth={2}
                        className="shrink-0 hidden group-hover:block text-[var(--text-muted)] group-hover:text-red-400 transition-colors"
                    />
                    <div className="flex-1 overflow-hidden flex justify-start">
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="font-mono text-[11px] uppercase tracking-wider whitespace-nowrap group-hover:text-red-400 transition-colors"
                                >
                                    Выйти ({displayName})
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </button>
            </div>
        </motion.aside>
    );
}
