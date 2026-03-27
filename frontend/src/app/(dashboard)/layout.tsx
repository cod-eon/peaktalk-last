import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-white flex">
      {/* Desktop Sidebar (Fixed) */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[72px] min-h-screen flex flex-col relative pb-16 md:pb-0 transition-all duration-300 overflow-x-hidden bg-page-geo">
        {/* Decorative corner geometry — visible on all dashboard pages */}
        <div className="pointer-events-none absolute top-0 right-0 w-[480px] h-[380px] z-0 overflow-hidden" aria-hidden="true">
          <svg width="480" height="380" viewBox="0 0 480 380" fill="none" className="opacity-[0.035]">
            <circle cx="480" cy="0" r="320" stroke="#8B5CF6" strokeWidth="1.5"/>
            <circle cx="480" cy="0" r="240" stroke="#F97316" strokeWidth="1"/>
            <circle cx="480" cy="0" r="170" stroke="#8B5CF6" strokeWidth="1.5"/>
            <circle cx="480" cy="0" r="110" stroke="#F97316" strokeWidth="1"/>
            <circle cx="480" cy="0" r="60" fill="#8B5CF6" fillOpacity="0.06"/>
          </svg>
        </div>
        {children}
      </main>

      {/* Mobile Navigation (Bottom Fixed) */}
      <MobileNav />
    </div>
  );
}
