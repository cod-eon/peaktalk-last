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
      <main className="flex-1 md:ml-[72px] min-h-screen flex flex-col relative pb-16 md:pb-0 transition-all duration-300 overflow-x-hidden">
        {children}
      </main>

      {/* Mobile Navigation (Bottom Fixed) */}
      <MobileNav />
    </div>
  );
}
