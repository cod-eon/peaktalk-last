'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  AlertCircle,
  Zap,
  CreditCard,
  UserCheck,
  Calendar,
  Activity,
  FileText,
  Check,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { AdminUser, AdminUsersResponse, SetPlanPayload } from '@/types/admin';
import type { PlanId } from '@/types/billing';

// ─── Plan badge ───────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: PlanId }) {
  if (plan === 'pro') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-accent-100 text-accent-700 border border-accent-200">
        <Zap size={9} />
        PRO
      </span>
    );
  }
  if (plan === 'team') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-100 text-violet-700 border border-violet-200">
        <UserCheck size={9} />
        TEAM
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--bg-surface-alt)] text-[var(--text-dim)] border border-[var(--border-main)]">
      <CreditCard size={9} />
      Starter
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
        Активна
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
        Отменена
      </span>
    );
  }
  if (status === 'past_due') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600 border border-red-200">
        Просрочена
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--bg-surface-alt)] text-[var(--text-dim)] border border-[var(--border-main)]">
      {status}
    </span>
  );
}

// ─── Set Plan Modal ───────────────────────────────────────────────────────────

interface SetPlanModalProps {
  user: AdminUser;
  onClose: () => void;
  onSuccess: () => void;
}

const PLAN_OPTIONS: Array<{ id: PlanId; label: string; needsDays: boolean }> = [
  { id: 'starter', label: 'Starter (бесплатный)', needsDays: false },
  { id: 'pro', label: 'PRO', needsDays: true },
  { id: 'team', label: 'Team', needsDays: true },
];

function SetPlanModal({ user, onClose, onSuccess }: SetPlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(user.plan);
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [loading, setLoading] = useState(false);

  const needsDays = selectedPlan !== 'starter';

  const handleApply = async () => {
    setLoading(true);
    try {
      const payload: SetPlanPayload = {
        plan: selectedPlan,
        period_days: needsDays ? periodDays : 0,
      };
      await api.post(`/admin/users/${user.id}/set-plan`, payload);
      toast.success(`План изменён на ${selectedPlan.toUpperCase()}`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка изменения плана';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[var(--z-overlay-backdrop)] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative bg-[var(--bg-surface)] rounded-[var(--radius-xl)] border border-[var(--border-main)] shadow-[var(--shadow-elevated)] w-full max-w-md z-[var(--z-overlay-panel)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--border-main)]">
          <div>
            <h2
              className="text-[17px] font-bold text-[var(--text-main)]"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              Изменить план
            </h2>
            <p className="text-[12px] text-[var(--text-dim)] mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-surface-alt)] text-[var(--text-dim)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Plan selector */}
          <div>
            <label className="block text-[12px] font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-3">
              Выберите план
            </label>
            <div className="flex flex-col gap-2">
              {PLAN_OPTIONS.map((option) => {
                const isSelected = selectedPlan === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedPlan(option.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-bg)]'
                        : 'border-[var(--border-main)] bg-[var(--bg-surface)] hover:border-[var(--border-light)] hover:bg-[var(--bg-surface-alt)]'
                    }`}
                  >
                    <span
                      className={`text-[14px] font-medium ${
                        isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-main)]'
                      }`}
                    >
                      {option.label}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Period days */}
          {needsDays && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
            >
              <label
                htmlFor="period-days"
                className="block text-[12px] font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-2"
              >
                Период (дней)
              </label>
              <input
                id="period-days"
                type="number"
                min={1}
                max={3650}
                value={periodDays}
                onChange={(e) => setPeriodDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] text-[14px] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary-glow)] transition-colors"
              />
              <p className="mt-1.5 text-[11px] text-[var(--text-dim)]">
                Доступ будет активен {periodDays} {periodDays === 1 ? 'день' : periodDays <= 4 ? 'дня' : 'дней'}
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-secondary text-sm"
          >
            Отмена
          </button>
          <button
            onClick={handleApply}
            disabled={loading}
            className="btn-primary text-sm gap-2"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : null}
            Применить
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── User Detail Drawer ───────────────────────────────────────────────────────

interface UserDetailDrawerProps {
  user: AdminUser;
  onClose: () => void;
  onChangePlan: () => void;
}

function UserDetailDrawer({ user, onClose, onChangePlan }: UserDetailDrawerProps) {
  const periodEnd = user.period_end
    ? new Date(user.period_end).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const createdAt = new Date(user.created_at).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[var(--z-overlay-backdrop)] bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed right-0 top-0 h-full w-full max-w-sm bg-[var(--bg-surface)] border-l border-[var(--border-main)] shadow-[var(--shadow-elevated)] z-[var(--z-overlay-panel)] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border-main)]">
          <h3
            className="text-[16px] font-bold text-[var(--text-main)]"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            Профиль пользователя
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-surface-alt)] text-[var(--text-dim)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {/* Email & Plan */}
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-semibold text-[var(--text-main)] break-all">{user.email}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <PlanBadge plan={user.plan} />
              <StatusBadge status={user.subscription_status} />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-surface-alt)] rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-[var(--text-dim)] mb-1.5">
                <Activity size={13} />
                <span className="text-[11px] font-medium">Симуляции</span>
              </div>
              <p className="text-[22px] font-bold text-[var(--text-main)]" style={{ fontFamily: 'var(--font-syne)' }}>
                {user.simulations_used}
              </p>
            </div>
            <div className="bg-[var(--bg-surface-alt)] rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-[var(--text-dim)] mb-1.5">
                <FileText size={13} />
                <span className="text-[11px] font-medium">Документы</span>
              </div>
              <p className="text-[22px] font-bold text-[var(--text-main)]" style={{ fontFamily: 'var(--font-syne)' }}>
                {user.documents_uploaded}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-3">
            {periodEnd && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-surface-alt)] flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar size={13} className="text-[var(--text-dim)]" />
                </div>
                <div>
                  <p className="text-[11px] text-[var(--text-dim)] font-medium uppercase tracking-wide">Подписка до</p>
                  <p className="text-[13px] text-[var(--text-main)] mt-0.5">{periodEnd}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[var(--bg-surface-alt)] flex items-center justify-center shrink-0 mt-0.5">
                <Users size={13} className="text-[var(--text-dim)]" />
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-dim)] font-medium uppercase tracking-wide">Зарегистрирован</p>
                <p className="text-[13px] text-[var(--text-main)] mt-0.5">{createdAt}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[var(--bg-surface-alt)] flex items-center justify-center shrink-0 mt-0.5">
                <CreditCard size={13} className="text-[var(--text-dim)]" />
              </div>
              <div>
                <p className="text-[11px] text-[var(--text-dim)] font-medium uppercase tracking-wide">ID</p>
                <p className="text-[12px] text-[var(--text-main)] mt-0.5 font-mono break-all">{user.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border-main)]">
          <button
            onClick={onChangePlan}
            className="btn-primary w-full gap-2 text-sm justify-center"
          >
            <Zap size={14} />
            Изменить план
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  }, []);

  const { data, isLoading, isError, error } = useQuery<AdminUsersResponse>({
    queryKey: ['admin-users', page, debouncedSearch],
    queryFn: () =>
      api.get(
        `/admin/users?page=${page}&per_page=20${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}`,
      ),
    staleTime: 30_000,
    retry: 1,
  });

  const handleRowClick = (user: AdminUser) => {
    setSelectedUser(user);
    setShowPlanModal(false);
  };

  const handleCloseDrawer = () => {
    setSelectedUser(null);
    setShowPlanModal(false);
  };

  const handleChangePlan = () => {
    setShowPlanModal(true);
  };

  const handlePlanSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const totalPages = data?.pages ?? 1;

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[12px] text-[var(--text-dim)] mb-1.5 font-semibold uppercase tracking-wider">
          Управление
        </p>
        <h1
          className="text-[28px] sm:text-[32px] font-bold text-[var(--text-main)] leading-tight"
          style={{ letterSpacing: '-0.025em', fontFamily: 'var(--font-syne)' }}
        >
          Пользователи
        </h1>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-placeholder)]" />
          <input
            type="text"
            placeholder="Поиск по email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] text-[14px] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary-glow)] transition-colors"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-main)] cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-main)] shadow-[var(--shadow-card)] overflow-hidden"
      >
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[var(--accent-primary)]" />
          </div>
        )}

        {isError && (
          <div className="flex items-start gap-3 m-5 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>{error instanceof Error ? error.message : 'Не удалось загрузить пользователей.'}</p>
          </div>
        )}

        {data && !isLoading && (
          <>
            {/* Desktop table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-[var(--border-main)] bg-[var(--bg-surface-alt)]">
                    {['Email', 'План', 'Статус', 'Подписка до', 'Симуляции', 'Документы'].map(
                      (col) => (
                        <th
                          key={col}
                          className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--text-dim)] uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-main)]">
                  {data.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-12 text-[var(--text-dim)] text-sm"
                      >
                        <Users size={28} className="mx-auto mb-2 opacity-30" />
                        Пользователи не найдены
                      </td>
                    </tr>
                  ) : (
                    data.items.map((user) => {
                      const periodEnd = user.period_end
                        ? new Date(user.period_end).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—';
                      return (
                        <tr
                          key={user.id}
                          onClick={() => handleRowClick(user)}
                          className={`hover:bg-[var(--bg-surface-alt)] transition-colors cursor-pointer ${
                            selectedUser?.id === user.id
                              ? 'bg-[var(--accent-primary-bg)]'
                              : ''
                          }`}
                        >
                          <td className="px-4 py-3.5 text-[13px] text-[var(--text-main)] font-medium max-w-[200px] truncate">
                            {user.email}
                          </td>
                          <td className="px-4 py-3.5">
                            <PlanBadge plan={user.plan} />
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={user.subscription_status} />
                          </td>
                          <td className="px-4 py-3.5 text-[12px] text-[var(--text-dim)] font-mono whitespace-nowrap">
                            {periodEnd}
                          </td>
                          <td className="px-4 py-3.5 text-[13px] text-[var(--text-muted)] text-center">
                            {user.simulations_used}
                          </td>
                          <td className="px-4 py-3.5 text-[13px] text-[var(--text-muted)] text-center">
                            {user.documents_uploaded}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-main)] bg-[var(--bg-surface-alt)]">
                <p className="text-[12px] text-[var(--text-dim)]">
                  Стр. {page} из {totalPages} · Всего: {data.total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-main)] text-[var(--text-dim)] hover:bg-[var(--bg-surface)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                          p === page
                            ? 'bg-[var(--accent-primary)] text-white border border-[var(--accent-primary)]'
                            : 'border border-[var(--border-main)] text-[var(--text-dim)] hover:bg-[var(--bg-surface)]'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border-main)] text-[var(--text-dim)] hover:bg-[var(--bg-surface)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* User detail drawer + plan modal */}
      <AnimatePresence>
        {selectedUser && !showPlanModal && (
          <UserDetailDrawer
            user={selectedUser}
            onClose={handleCloseDrawer}
            onChangePlan={handleChangePlan}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedUser && showPlanModal && (
          <SetPlanModal
            user={selectedUser}
            onClose={() => setShowPlanModal(false)}
            onSuccess={handlePlanSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
