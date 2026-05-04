import { create } from 'zustand';
import type { BillingStatus, UpgradeReason } from '@/types/billing';
import { api } from '@/lib/api';

interface BillingStore {
  status: BillingStatus | null;
  isLoading: boolean;
  upgradeModalOpen: boolean;
  upgradeModalReason: UpgradeReason | null;

  fetchStatus: () => Promise<void>;
  openUpgradeModal: (reason: UpgradeReason) => void;
  closeUpgradeModal: () => void;

  // Computed helpers
  isPro: () => boolean;
  isStarter: () => boolean;
  simulationsLeft: () => number | null;
  documentsLeft: () => number | null;
}

export const useBillingStore = create<BillingStore>((set, get) => ({
  status: null,
  isLoading: false,
  upgradeModalOpen: false,
  upgradeModalReason: null,

  fetchStatus: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get('/billing/status');
      set({ status: data as BillingStatus, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  openUpgradeModal: (reason: UpgradeReason) => {
    set({ upgradeModalOpen: true, upgradeModalReason: reason });
  },

  closeUpgradeModal: () => {
    set({ upgradeModalOpen: false, upgradeModalReason: null });
  },

  isPro: () => {
    const { status } = get();
    if (!status) return false;
    return ['pro', 'team'].includes(status.subscription.plan);
  },

  isStarter: () => {
    const { status } = get();
    if (!status) return false; // Don't assume starter if loading
    return ['free', 'starter', 'personal'].includes(status.subscription.plan);
  },

  simulationsLeft: () => {
    const { status } = get();
    if (!status) return null;
    const limit = status.limits.simulations_per_month;
    if (limit === null) return null; // unlimited
    return Math.max(0, limit - status.usage.simulations_used);
  },

  documentsLeft: () => {
    const { status } = get();
    if (!status) return null;
    const limit = status.limits.documents_total;
    if (limit === null) return null; // unlimited
    return Math.max(0, limit - status.usage.documents_uploaded);
  },
}));
