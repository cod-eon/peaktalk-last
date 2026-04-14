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
import { NotificationsPopover } from '@/components/NotificationsPopover';

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
            className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-neutral-200 bg-white z-40 overflow-hidden"
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-5 border-b border-neutral-200 shrink-0 bg-white z-10 w-full">
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
                                <span className="brand-wordmark whitespace-nowrap text-neutral-900 text-[15px]">
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
                                flex items-center gap-3 px-2.5 h-9 transition-all duration-150 relative group w-[216px]
                                ${isActive
                                    ? 'bg-neutral-100 text-neutral-900'
                                    : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
                                }
                            `}
                        >
                            <item.icon
                                size={17}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={`shrink-0 transition-colors ${
                                    isActive
                                        ? 'text-neutral-900'
                                        : 'text-neutral-400 group-hover:text-neutral-500'
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
                                            className={`text-[13px] whitespace-nowrap font-inter ${
                                                isActive ? 'font-semibold text-neutral-900' : 'font-medium'
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
            <div className="px-2.5 pb-4 flex flex-col gap-0.5 shrink-0 bg-white z-10 w-full border-t border-neutral-200 pt-3">
                <Link
                    href="/settings"
                    title={!isExpanded ? "Настройки" : undefined}
                    className={`flex items-center gap-3 px-2.5 h-9 transition-all duration-150 w-[216px] ${
                        pathname === '/settings' || pathname?.startsWith('/settings/')
                            ? 'bg-neutral-100 text-neutral-900'
                            : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
                    }`}
                >
                    <Settings
                        size={17}
                        strokeWidth={pathname === '/settings' ? 2.5 : 2}
                        className={`shrink-0 ${pathname === '/settings' || pathname?.startsWith('/settings/') ? 'text-neutral-900' : ''}`}
                    />
                    <div className="flex-1 overflow-hidden">
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.12 }}
                                    className={`text-[13px] font-inter whitespace-nowrap ${
                                        pathname === '/settings' || pathname?.startsWith('/settings/') ? 'font-semibold text-neutral-900' : 'font-medium'
                                    }`}
                                >
                                    Настройки
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </Link>

                <div className="flex items-center w-full px-1 py-1">
                    <NotificationsPopover />
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.12 }}
                                className="text-[13px] font-inter font-medium text-neutral-400 ml-2"
                            >
                                Уведомления
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={handleLogout}
                    title={!isExpanded ? "Выйти" : undefined}
                    className="flex items-center gap-3 px-2.5 h-9 transition-all duration-150 text-neutral-400 hover:text-red-500 hover:bg-red-50 w-[216px] cursor-pointer"
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
                            className="mt-2 px-2.5 py-2 flex items-center gap-2.5 border-t border-neutral-200"
                        >
                            <div className="w-6 h-6 rounded-none bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-neutral-600">
                                    {displayName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                <span className="text-[12px] text-neutral-500 font-inter truncate leading-none">
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
