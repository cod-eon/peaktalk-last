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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 text-neutral-500 border border-neutral-200">
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
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-500 border border-neutral-200">
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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
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
        className="relative bg-white rounded-2xl border border-neutral-200 w-full max-w-md z-[70]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-200">
          <div>
            <h2
              className="text-[17px] font-bold font-inter text-neutral-900"
            >
              Изменить план
            </h2>
            <p className="text-[12px] text-neutral-400 mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Plan selector */}
          <div>
            <label className="block text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">
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
                        ? 'border-neutral-900 bg-neutral-100'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <span
                      className={`text-[14px] font-medium ${
                        isSelected ? 'text-neutral-900' : 'text-neutral-900'
                      }`}
                    >
                      {option.label}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#171717] flex items-center justify-center">
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
                className="block text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-2"
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
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-900 text-[14px] focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 transition-colors"
              />
              <p className="mt-1.5 text-[11px] text-neutral-400">
                Доступ будет активен {periodDays} {periodDays === 1 ? 'день' : periodDays <= 4 ? 'дня' : 'дней'}
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 text-sm font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            onClick={handleApply}
            disabled={loading}
            className="flex items-center gap-2 bg-[#171717] hover:bg-black text-white font-inter font-semibold rounded-xl px-6 py-2 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed right-0 top-0 h-full w-full max-w-sm bg-white border-l border-neutral-200 z-[70] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-neutral-200">
          <h3
            className="text-[16px] font-bold font-inter text-neutral-900"
          >
            Профиль пользователя
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          {/* Email & Plan */}
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-semibold text-neutral-900 break-all">{user.email}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <PlanBadge plan={user.plan} />
              <StatusBadge status={user.subscription_status} />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-50 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-neutral-400 mb-1.5">
                <Activity size={13} />
                <span className="text-[11px] font-medium">Симуляции</span>
              </div>
              <p className="text-[22px] font-bold font-inter text-neutral-900">
                {user.simulations_used}
              </p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-neutral-400 mb-1.5">
                <FileText size={13} />
                <span className="text-[11px] font-medium">Документы</span>
              </div>
              <p className="text-[22px] font-bold font-inter text-neutral-900">
                {user.documents_uploaded}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-3">
            {periodEnd && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar size={13} className="text-neutral-400" />
                </div>
                <div>
                  <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide">Подписка до</p>
                  <p className="text-[13px] text-neutral-900 mt-0.5">{periodEnd}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
                <Users size={13} className="text-neutral-400" />
              </div>
              <div>
                <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide">Зарегистрирован</p>
                <p className="text-[13px] text-neutral-900 mt-0.5">{createdAt}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
                <CreditCard size={13} className="text-neutral-400" />
              </div>
              <div>
                <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide">ID</p>
                <p className="text-[12px] text-neutral-900 mt-0.5 font-mono break-all">{user.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-200">
          <button
            onClick={onChangePlan}
            className="w-full flex items-center justify-center gap-2 bg-[#171717] hover:bg-black text-white font-inter font-semibold rounded-xl px-6 py-3 text-sm transition-all"
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
        <p className="text-[12px] text-neutral-400 mb-1.5 font-semibold uppercase tracking-wider">
          Управление
        </p>
        <h1
          className="text-[28px] sm:text-[32px] font-bold font-inter text-neutral-900 leading-tight tracking-[-0.025em]"
        >
          Пользователи
        </h1>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Поиск по email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-[14px] placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200 transition-colors"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 cursor-pointer"
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
        className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
      >
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-neutral-900" />
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
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    {['Email', 'План', 'Статус', 'Подписка до', 'Симуляции', 'Документы'].map(
                      (col) => (
                        <th
                          key={col}
                          className="text-left px-4 py-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-12 text-neutral-400 text-sm"
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
                          className={`hover:bg-neutral-50 transition-colors cursor-pointer ${
                            selectedUser?.id === user.id
                              ? 'bg-neutral-100'
                              : ''
                          }`}
                        >
                          <td className="px-4 py-3.5 text-[13px] text-neutral-900 font-medium max-w-[200px] truncate">
                            {user.email}
                          </td>
                          <td className="px-4 py-3.5">
                            <PlanBadge plan={user.plan} />
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={user.subscription_status} />
                          </td>
                          <td className="px-4 py-3.5 text-[12px] text-neutral-400 font-mono whitespace-nowrap">
                            {periodEnd}
                          </td>
                          <td className="px-4 py-3.5 text-[13px] text-neutral-500 text-center">
                            {user.simulations_used}
                          </td>
                          <td className="px-4 py-3.5 text-[13px] text-neutral-500 text-center">
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
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50">
                <p className="text-[12px] text-neutral-400">
                  Стр. {page} из {totalPages} · Всего: {data.total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                            ? 'bg-[#171717] text-white border border-neutral-900'
                            : 'border border-neutral-200 text-neutral-500 hover:bg-white'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-400 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
