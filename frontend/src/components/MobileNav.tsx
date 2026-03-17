"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FolderDot,
    FileText,
    Bot,
    BarChart2,
} from 'lucide-react';

const NAV_ITEMS = [
    { name: 'Дашборд', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Проекты', path: '/projects', icon: FolderDot },
    { name: 'Документы', path: '/documents', icon: FileText },
    { name: 'Симуляция', path: '/simulation', icon: Bot },
    { name: 'Аналитика', path: '/analytics', icon: BarChart2 },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
            <nav className="bg-[var(--bg-surface-alt)]/90 backdrop-blur-md rounded-2xl border border-[var(--border-light)] shadow-lg flex justify-around items-center h-16 px-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
                    
                    return (
                        <Link 
                            key={item.path} 
                            href={item.path}
                            className={`
                                flex flex-col items-center justify-center w-full h-full space-y-1 relative
                                ${isActive ? 'text-[var(--accent-blue)]' : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'}
                            `}
                        >
                            {isActive && (
                                <span className="absolute -top-3 w-8 h-1 bg-[var(--accent-blue)] rounded-b-lg shadow-[0_0_10px_var(--accent-blue)]" />
                            )}
                            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium leading-none">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
