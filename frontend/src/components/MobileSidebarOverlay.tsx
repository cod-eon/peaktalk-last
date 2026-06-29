"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Settings,
    X,
    Bot,
    FileText,
    LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';

const navItems = [
    { name: 'Дашборд', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Материалы', path: '/documents', icon: FileText },
    { name: 'Стресс-тесты', path: '/simulation', icon: Bot },
    { name: 'Настройки', path: '/settings', icon: Settings },
];

interface MobileSidebarOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileSidebarOverlay({ isOpen, onClose }: MobileSidebarOverlayProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuthStore();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        onClose();
        router.push('/login');
        router.refresh();
    };

    const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Пользователь';
    const firstLetter = displayName.charAt(0).toUpperCase();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"
                    />

                    {/* Drawer */}
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-neutral-200 z-[9999] flex flex-col pt-safe"
                    >
                        {/* Header */}
                        <div className="px-5 h-16 flex items-center justify-between border-b border-neutral-200">
                            <Link href="/" onClick={onClose} className="flex items-center gap-3 hover:opacity-75 transition-opacity">
                                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                    <Image src="/logo_svg.svg" alt="PeakTalk Logo" width={32} height={32} />
                                </div>
                                <span className="brand-wordmark text-neutral-900 text-[15px]">
                                    PeakTalk
                                </span>
                            </Link>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-none text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Nav */}
                        <div className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                            {navItems.map((item) => {
                                const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        onClick={onClose}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-none border transition-all text-[13px] font-medium font-inter ${
                                            isActive
                                                ? 'bg-neutral-100 text-neutral-900 border-neutral-200'
                                                : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 border-transparent'
                                        }`}
                                    >
                                        <item.icon
                                            size={17}
                                            strokeWidth={isActive ? 2.5 : 2}
                                            className={isActive ? 'text-neutral-900' : 'text-neutral-400'}
                                        />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-neutral-200 mt-auto flex flex-col gap-3">
                            {/* User chip */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-none bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-sm text-neutral-900 shrink-0 uppercase">
                                        {firstLetter}
                                    </div>
                                    <div className="text-[13px] font-medium text-neutral-900 truncate">{displayName}</div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-8 h-8 flex items-center justify-center rounded-none text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                                    title="Выйти"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>

                            {/* Upsell card */}
                            <div className="bg-neutral-50 rounded-none p-4 border border-neutral-200">
                                <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-1">Текущий план</div>
                                <div className="text-[13px] text-neutral-900 font-medium mb-3">Больше стресс-тестов и Defense Brief</div>
                                <button className="w-full py-2 bg-[#171717] text-white text-[12px] font-semibold rounded-none hover:bg-black transition-colors">
                                    Открыть тарифы
                                </button>
                            </div>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
