"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    FolderOpen, 
    Activity, 
    Settings,
    X,
    Sparkles,
    Bot,
    FileText
} from 'lucide-react';

const navItems = [
    { name: 'Дашборд', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Проекты', path: '/dashboard/projects', icon: FolderOpen },
    { name: 'Документы', path: '/documents', icon: FileText },
    { name: 'Аналитика', path: '/dashboard/analytics', icon: Activity },
    { name: 'Симуляция', path: '/simulation', icon: Bot },
    { name: 'Настройки', path: '/dashboard/settings', icon: Settings },
];

interface MobileSidebarOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileSidebarOverlay({ isOpen, onClose }: MobileSidebarOverlayProps) {
    const pathname = usePathname();

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
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
                    />

                    {/* Drawer */}
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-72 bg-[var(--bg-surface)] border-r border-[var(--border-main)] z-[9999] flex flex-col pt-safe"
                    >
                        <div className="p-6 flex items-center justify-between border-b border-[var(--border-main)]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                    <Image src="/logo_svg.svg" alt="PeakTalk Logo" width={32} height={32} />
                                </div>
                                <span className="font-syne font-extrabold text-xl">PeakTalk</span>
                            </div>
                            <button onClick={onClose} className="p-2 text-[var(--text-dim)]">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {navItems.map((item) => {
                                const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
                                return (
                                    <Link 
                                        key={item.path} 
                                        href={item.path} 
                                        onClick={onClose}
                                        className={`flex items-center gap-4 p-4 rounded-lg font-mono text-xs uppercase tracking-wider transition-all ${isActive ? 'bg-[rgba(59,130,246,0.1)] text-white border border-[rgba(59,130,246,0.2)]' : 'text-[var(--text-muted)] hover:text-white'}`}
                                    >
                                        <item.icon size={18} className={isActive ? 'text-[var(--accent-blue)]' : ''} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="p-6 border-t border-[var(--border-main)] mt-auto">
                            <div className="bg-[var(--bg-surface-hover)] rounded-xl p-4 border border-[var(--border-light)]">
                                <div className="text-[10px] font-mono text-[var(--text-dim)] uppercase mb-2">Basic Plan</div>
                                <div className="text-xs text-white mb-4">Улучшите навыки с ИИ</div>
                                <button className="w-full py-2 bg-[var(--accent-blue)] text-white font-mono text-[10px] uppercase rounded hover:bg-[var(--accent-blue-hover)] transition-colors">
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
