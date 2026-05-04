'use client';

import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useBillingStore } from '@/store/billingStore';
import type { BillingStatus, UpgradeReason } from '@/types/billing';

export function useBilling() {
  const { status, isLoading, openUpgradeModal, isPro, isStarter, simulationsLeft, documentsLeft, fetchStatus } =
    useBillingStore();

  const { data, isLoading: queryLoading } = useQuery<BillingStatus>({
    queryKey: ['billing-status'],
    queryFn: () => api.get('/billing/status'),
    staleTime: 60_000,
    retry: false,
  });

  // Sync TanStack Query result into Zustand store
  useEffect(() => {
    if (data) {
      useBillingStore.setState({ status: data, isLoading: false });
    }
  }, [data]);

  const effectiveStatus = status ?? data ?? null;

  const getSimulationsLeft = () => {
    if (!effectiveStatus) return null;
    const limit = effectiveStatus.limits.simulations_per_month;
    if (limit === null) return null;
    return Math.max(0, limit - effectiveStatus.usage.simulations_used);
  };

  const getDocumentsLeft = () => {
    if (!effectiveStatus) return null;
    const limit = effectiveStatus.limits.documents_total;
    if (limit === null) return null;
    return Math.max(0, limit - effectiveStatus.usage.documents_uploaded);
  };

  const openUpgrade = useCallback(
    (reason: UpgradeReason) => openUpgradeModal(reason),
    [openUpgradeModal],
  );

  return {
    status: effectiveStatus,
    isLoading: isLoading || queryLoading,
    isPro: isPro(),
    isStarter: isStarter(),
    simulationsLeft: status ? simulationsLeft() : getSimulationsLeft(),
    documentsLeft: status ? documentsLeft() : getDocumentsLeft(),
    canStartSimulation: effectiveStatus?.can_start_simulation ?? true,
    canUploadDocument: effectiveStatus?.can_upload_document ?? true,
    openUpgrade,
    refetch: fetchStatus,
  };
}

/**
 * Wraps an API call and intercepts 402 responses to open UpgradeModal.
 * Usage:
 *   const { guard } = useBillingGuard();
 *   await guard(() => api.post('/simulation/...', body), 'simulations');
 */
export function useBillingGuard() {
  const { openUpgradeModal } = useBillingStore();

  const guard = useCallback(
    async <T>(fn: () => Promise<T>, fallbackReason: UpgradeReason = 'simulations'): Promise<T | null> => {
      try {
        return await fn();
      } catch (err: unknown) {
        if (err instanceof Error) {
          // Map error message keywords to upgrade reasons
          const msg = err.message.toLowerCase();
          let reason: UpgradeReason = fallbackReason;
          if (msg.includes('simulation') || msg.includes('симуляц')) {
            reason = 'simulations';
          } else if (msg.includes('document') || msg.includes('документ')) {
            reason = 'documents';
          } else if (msg.includes('persona') || msg.includes('персон')) {
            reason = 'personas';
          } else if (msg.includes('pdf')) {
            reason = 'pdf';
          }

          // Check if this is a 402-style error (limit exceeded codes)
          const is402 =
            msg.includes('limit') ||
            msg.includes('лимит') ||
            msg.includes('exceeded') ||
            msg.includes('not allowed') ||
            msg.includes('недоступн') ||
            msg.includes('доступен только');

          if (is402) {
            openUpgradeModal(reason);
            return null;
          }
        }
        throw err;
      }
    },
    [openUpgradeModal],
  );

  return { guard };
}
