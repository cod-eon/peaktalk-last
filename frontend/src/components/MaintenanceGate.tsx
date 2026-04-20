'use client';

import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { MaintenanceScreen } from '@/components/MaintenanceScreen';

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { data } = useQuery<{ enabled: boolean }>({
    queryKey: ['maintenance-status'],
    queryFn: () => api.get('/system/maintenance'),
    staleTime: 15_000,
    refetchInterval: 20_000,
    retry: 1,
  });

  if (data?.enabled) {
    return <MaintenanceScreen />;
  }

  return <>{children}</>;
}
