"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    Bot,
    Settings,
    CreditCard,
} from 'lucide-react';

const NAV_ITEMS = [
    { name: 'Дашборд', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Тексты', path: '/documents', icon: FileText },
    { name: 'Симуляции', path: '/simulation', icon: Bot },
    { name: 'Подписка', path: '/billing', icon: CreditCard },
    { name: 'Настройки', path: '/settings', icon: Settings },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom">
            <div className="mx-3 mb-3">
                <nav className="bg-[var(--bg-surface-alt)]/95 backdrop-blur-xl rounded-[var(--radius-lg)] border border-[var(--border-main)] shadow-[var(--shadow-elevated)] flex justify-around items-center h-[60px] px-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`
                                    flex flex-col items-center justify-center gap-1 flex-1 h-full relative rounded-[var(--radius-sm)] transition-colors duration-150
                                    ${isActive
                                        ? 'text-[var(--accent-primary)]'
                                        : 'text-[var(--text-dim)] hover:text-[var(--text-muted)]'
                                    }
                                `}
                            >
                                {isActive && (
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-[var(--accent-primary)] rounded-b-full" />
                                )}
                                <item.icon
                                    size={19}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className="text-[9px] font-medium font-inter leading-none tracking-wide">
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
