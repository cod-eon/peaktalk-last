import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { MobileHeader } from '@/components/MobileHeader';
import { MaintenanceGate } from '@/components/MaintenanceGate';
import { NotificationRealtime } from '@/components/NotificationRealtime';
import { PushPromoDialog } from '@/components/PushPromoDialog';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MaintenanceGate>
      <div className="min-h-screen bg-white flex">
        <NotificationRealtime />

        {/* Desktop Sidebar (Fixed) */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 md:ml-[72px] min-h-screen flex flex-col bg-white pb-16 md:pb-0 overflow-x-hidden relative">
          <MobileHeader />
          {children}
        </main>

        {/* Mobile Navigation (Bottom Fixed) */}
        <MobileNav />

        {/* Global Modals for Authenticated App */}
        <PushPromoDialog />
      </div>
    </MaintenanceGate>
  );
}
