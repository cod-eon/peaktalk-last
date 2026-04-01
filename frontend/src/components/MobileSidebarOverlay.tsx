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
    { name: 'Мои тексты', path: '/documents', icon: FileText },
    { name: 'Симуляции', path: '/simulation', icon: Bot },
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
                        className="fixed top-0 left-0 bottom-0 w-72 bg-[var(--bg-surface)] border-r border-[var(--border-main)] z-[9999] flex flex-col pt-safe"
                    >
                        {/* Header */}
                        <div className="px-5 h-16 flex items-center justify-between border-b border-[var(--border-main)]">
                            <Link href="/" onClick={onClose} className="flex items-center gap-3 hover:opacity-75 transition-opacity">
                                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                    <Image src="/logo_svg.svg" alt="PeakTalk Logo" width={32} height={32} />
                                </div>
                                <span className="text-[var(--text-main)]" style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>
                                    PeakTalk
                                </span>
                            </Link>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-alt)] transition-colors"
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
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] border transition-all text-[13px] font-medium font-inter ${
                                            isActive
                                                ? 'sidebar-item-active text-[var(--accent-primary)] border-accent-100'
                                                : 'text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-alt)] border-transparent'
                                        }`}
                                    >
                                        <item.icon
                                            size={17}
                                            strokeWidth={isActive ? 2.5 : 2}
                                            className={isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-dim)]'}
                                        />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[var(--border-main)] mt-auto flex flex-col gap-3">
                            {/* User chip */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-accent-100 border border-accent-200 flex items-center justify-center font-bold text-sm text-accent-500 shrink-0 uppercase">
                                        {firstLetter}
                                    </div>
                                    <div className="text-[13px] font-medium text-[var(--text-main)] truncate">{displayName}</div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-dim)] hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                                    title="Выйти"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>

                            {/* Upsell card */}
                            <div className="bg-accent-50 rounded-xl p-4 border border-accent-100">
                                <div className="text-[11px] font-medium text-accent-400 uppercase tracking-wide mb-1">Basic Plan</div>
                                <div className="text-[13px] text-[var(--text-main)] font-medium mb-3">Улучшите навыки с ИИ</div>
                                <button className="w-full py-2 bg-[var(--accent-primary)] text-white text-[12px] font-semibold rounded-[var(--radius-sm)] hover:bg-[var(--accent-primary-hover)] transition-colors">
                                    Upgrade to Pro
                                </button>
                            </div>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
