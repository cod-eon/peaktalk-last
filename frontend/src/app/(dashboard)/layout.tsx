import React from 'react';
import { MaintenanceGate } from '@/components/MaintenanceGate';
import { NotificationRealtime } from '@/components/NotificationRealtime';
import { WorkspaceShell } from '@/components/peak/WorkspaceShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MaintenanceGate>
      <WorkspaceShell>
        <NotificationRealtime />
        {children}
      </WorkspaceShell>
    </MaintenanceGate>
  );
}
