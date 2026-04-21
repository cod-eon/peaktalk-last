'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  FileText,
  Loader2,
  Search,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  formatAdminCurrency,
  formatAdminDate,
} from '@/lib/admin';
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  AdminPlanBadge,
  AdminSubscriptionBadge,
} from '@/components/admin/AdminPrimitives';
import type {
  AdminPlanId,
  AdminUserDetail,
  AdminUsersResponse,
  SetPlanPayload,
} from '@/types/admin';

const PLAN_OPTIONS: Array<{
  id: Exclude<AdminPlanId, 'per_session' | 'starter'>;
  label: string;
  description: string;
  needsDays: boolean;
}> = [
  { id: 'free', label: 'Free', description: 'Базовый бесплатный доступ.', needsDays: false },
  { id: 'personal', label: 'Personal', description: '10 сессий в месяц и PDF.', needsDays: true },
  { id: 'pro', label: 'Pro', description: 'Безлимит, аналитика, приоритет.', needsDays: true },
  { id: 'team', label: 'Team', description: 'Командный тариф и общий контур.', needsDays: true },
];

function SetPlanModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUserDetail;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const initialPlan = PLAN_OPTIONS.some((option) => option.id === user.plan)
    ? (user.plan as Exclude<AdminPlanId, 'per_session' | 'starter'>)
    : 'free';
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [periodDays, setPeriodDays] = useState(30);
  const [loading, setLoading] = useState(false);

  const optionMeta = PLAN_OPTIONS.find((option) => option.id === selectedPlan) ?? PLAN_OPTIONS[0];

  const handleApply = async () => {
    setLoading(true);
    try {
      const payload: SetPlanPayload = {
        plan: selectedPlan,
        period_days: optionMeta.needsDays ? periodDays : 30,
      };
      await api.post(`/admin/users/${user.id}/set-plan`, payload);
      toast.success(`План пользователя изменён на ${optionMeta.label}.`);
      onSuccess();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось изменить план.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.98 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-xl border border-black/10 bg-[#f5f1ea] shadow-[0_30px_80px_rgba(17,24,39,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-black/8 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-neutral-500">Access Control</p>
              <h2 className="mt-2 font-syne text-[28px] leading-[0.95] tracking-[-0.05em] text-neutral-950">
                Изменить план пользователя
              </h2>
              <p className="mt-2 text-sm text-neutral-600">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center border border-black/10 bg-white text-neutral-700 transition-colors hover:bg-neutral-100"
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-6">
          <div className="grid gap-3">
            {PLAN_OPTIONS.map((option) => {
              const selected = selectedPlan === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedPlan(option.id)}
                  className={`grid gap-1 border px-4 py-4 text-left transition-colors ${
                    selected
                      ? 'border-neutral-950 bg-neutral-950 text-white'
                      : 'border-black/10 bg-white text-neutral-950 hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold uppercase tracking-[0.18em]">{option.label}</span>
                    <span className={`h-3 w-3 rounded-full ${selected ? 'bg-[var(--accent-primary)]' : 'bg-neutral-300'}`} />
                  </div>
                  <p className={`text-sm leading-6 ${selected ? 'text-white/74' : 'text-neutral-600'}`}>{option.description}</p>
                </button>
              );
            })}
          </div>

          {optionMeta.needsDays ? (
            <div className="border border-black/8 bg-white px-4 py-4">
              <label htmlFor="period-days" className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                Длительность доступа
              </label>
              <div className="mt-3 flex items-center gap-3">
                <input
                  id="period-days"
                  type="number"
                  min={1}
                  max={3650}
                  value={periodDays}
                  onChange={(event) => setPeriodDays(Math.max(1, Number.parseInt(event.target.value, 10) || 1))}
                  className="w-32 border border-black/10 bg-[#f7f4ee] px-3 py-3 text-sm text-neutral-950 outline-none transition-colors focus:border-neutral-950"
                />
                <p className="text-sm text-neutral-600">Период в днях. Для free это поле не используется.</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-black/8 px-5 py-5 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center border border-black/10 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={15} />}
            Сохранить план
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function UserDetailDrawer({
  userId,
  onClose,
  onChangePlan,
}: {
  userId: string;
  onClose: () => void;
  onChangePlan: (user: AdminUserDetail) => void;
}) {
  const { data, isLoading, isError, error } = useQuery<AdminUserDetail>({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => api.get(`/admin/users/${userId}`),
    enabled: Boolean(userId),
    retry: 1,
    staleTime: 30_000,
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed right-0 top-0 z-[65] flex h-full w-full max-w-xl flex-col border-l border-black/10 bg-[#f5f1ea] shadow-[0_30px_80px_rgba(17,24,39,0.18)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/8 px-5 py-5 sm:px-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-neutral-500">Client Profile</p>
            <h3 className="mt-2 font-syne text-[30px] leading-[0.95] tracking-[-0.05em] text-neutral-950">
              Карточка пользователя
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center border border-black/10 bg-white text-neutral-700 transition-colors hover:bg-neutral-100"
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-neutral-700" />
            </div>
          ) : null}

          {isError ? (
            <div className="flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error instanceof Error ? error.message : 'Не удалось загрузить профиль.'}</p>
            </div>
          ) : null}

          {data ? (
            <div className="grid gap-4">
              <div className="border border-black/10 bg-white px-4 py-4">
                <p className="break-all text-lg font-semibold tracking-[-0.03em] text-neutral-950">{data.email}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <AdminPlanBadge plan={data.plan} />
                  <AdminSubscriptionBadge status={data.subscription_status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Всего симуляций', value: data.simulations_total.toLocaleString('ru-RU'), icon: Activity },
                  { label: 'В текущем цикле', value: data.simulations_used.toLocaleString('ru-RU'), icon: Zap },
                  { label: 'Документы', value: data.documents_uploaded.toLocaleString('ru-RU'), icon: FileText },
                  { label: 'Оплаты', value: data.payments_count.toLocaleString('ru-RU'), icon: Wallet },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="border border-black/8 bg-[rgba(17,24,39,0.02)] px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">{item.label}</p>
                        <Icon size={14} className="text-neutral-500" />
                      </div>
                      <div className="mt-3 text-[26px] font-semibold tracking-[-0.04em] text-neutral-950">{item.value}</div>
                    </div>
                  );
                })}
              </div>

              <AdminPanel title="Billing" subtitle="Данные подписки и суммарный денежный след.">
                <div className="grid gap-3 px-5 py-5">
                  {[
                    { label: 'Период старт', value: formatAdminDate(data.period_start) },
                    { label: 'Период конец', value: formatAdminDate(data.period_end) },
                    { label: 'Создание подписки', value: formatAdminDate(data.subscription_created_at) },
                    { label: 'Платежей на сумму', value: formatAdminCurrency(data.payments_total_rub) },
                    { label: 'Регистрация', value: formatAdminDate(data.created_at) },
                    { label: 'ID', value: data.id },
                  ].map((item) => (
                    <div key={item.label} className="border border-black/8 bg-white px-4 py-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">{item.label}</p>
                      <p className="mt-2 break-all text-sm leading-6 text-neutral-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </AdminPanel>
            </div>
          ) : null}
        </div>

        <div className="border-t border-black/8 px-5 py-5 sm:px-6">
          <button
            type="button"
            onClick={() => data && onChangePlan(data)}
            disabled={!data}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-neutral-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Zap size={15} />
            Изменить план
          </button>
        </div>
      </motion.aside>
    </>
  );
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserDetail | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
      setPage(1);
    }, 350);
  };

  const { data, isLoading, isError, error } = useQuery<AdminUsersResponse>({
    queryKey: ['admin-users', page, debouncedSearch],
    queryFn: () =>
      api.get(
        `/admin/users?page=${page}&per_page=20${
          debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''
        }`,
      ),
    staleTime: 30_000,
    retry: 1,
  });

  const pageStats = useMemo(() => {
    const items = data?.items ?? [];
    const activeOnPage = items.filter((item) => item.subscription_status === 'active').length;
    const simulationsOnPage = items.reduce((sum, item) => sum + item.simulations_total, 0);
    const documentsOnPage = items.reduce((sum, item) => sum + item.documents_uploaded, 0);

    return { activeOnPage, simulationsOnPage, documentsOnPage };
  }, [data?.items]);

  const handlePlanSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    if (editingUser) {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', editingUser.id] });
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <AdminPageHeader
        eyebrow="Operations / Users"
        title="Реальная база пользователей, а не декоративный CRM."
        description="Поиск теперь работает по email на backend, карточка пользователя берётся из detail endpoint, а ручное изменение тарифов ограничено реальными планами продукта."
        index="02"
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: 'Найдено пользователей',
            value: (data?.total ?? 0).toLocaleString('ru-RU'),
            helper: debouncedSearch ? 'Количество после применения фильтра по email.' : 'Полный объём в выдаче /admin/users.',
          },
          {
            label: 'Активны на странице',
            value: pageStats.activeOnPage.toLocaleString('ru-RU'),
            helper: 'Подписки со статусом active на текущей странице списка.',
          },
          {
            label: 'Симуляций на странице',
            value: pageStats.simulationsOnPage.toLocaleString('ru-RU'),
            helper: `Документов на странице: ${pageStats.documentsOnPage.toLocaleString('ru-RU')}.`,
          },
        ].map((item) => (
          <div key={item.label} className="border border-black/10 bg-white px-5 py-5 shadow-[0_18px_60px_rgba(17,24,39,0.05)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-neutral-500">{item.label}</p>
            <div className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-neutral-950">{item.value}</div>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{item.helper}</p>
          </div>
        ))}
      </div>

      <AdminPanel
        title="Directory"
        subtitle="Клик по строке открывает детальную карточку. Поиск работает по email и больше не делает вид, что фильтрует."
        aside={
          <div className="relative w-full max-w-md">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Поиск по email"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="min-h-11 w-full border border-black/10 bg-[#f7f4ee] pl-10 pr-10 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950"
            />
            {search ? (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center text-neutral-500"
                aria-label="Сбросить поиск"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-neutral-700" />
          </div>
        ) : null}

        {isError ? (
          <div className="m-5 flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 sm:m-6">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{error instanceof Error ? error.message : 'Не удалось загрузить пользователей.'}</p>
          </div>
        ) : null}

        {data && !isLoading ? (
          <>
            {data.items.length === 0 ? (
              <AdminEmptyState
                icon={Users}
                title="Ничего не найдено"
                description="Фильтр не вернул ни одного пользователя. Проверьте email или очистите поиск."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead>
                    <tr className="border-b border-black/8 bg-[rgba(17,24,39,0.03)]">
                      {['Клиент', 'План', 'Статус', 'Подписка до', 'Всего симуляций', 'Документы', 'Регистрация'].map((column) => (
                        <th
                          key={column}
                          className="px-5 py-4 text-left font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500 sm:px-6"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className="cursor-pointer border-b border-black/6 bg-white transition-colors hover:bg-[rgba(17,24,39,0.03)]"
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <div className="max-w-[260px]">
                            <p className="truncate text-sm font-semibold text-neutral-950">{user.email}</p>
                            <p className="mt-1 text-xs text-neutral-500">ID: {user.id.slice(0, 8)}…</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 sm:px-6">
                          <AdminPlanBadge plan={user.plan} />
                        </td>
                        <td className="px-5 py-4 sm:px-6">
                          <AdminSubscriptionBadge status={user.subscription_status} />
                        </td>
                        <td className="px-5 py-4 text-sm text-neutral-700 sm:px-6">{formatAdminDate(user.period_end)}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-neutral-950 sm:px-6">
                          {user.simulations_total.toLocaleString('ru-RU')}
                        </td>
                        <td className="px-5 py-4 text-sm text-neutral-700 sm:px-6">
                          {user.documents_uploaded.toLocaleString('ru-RU')}
                        </td>
                        <td className="px-5 py-4 text-sm text-neutral-700 sm:px-6">{formatAdminDate(user.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <AdminPagination
              page={data.page}
              pages={data.pages}
              total={data.total}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </AdminPanel>

      <AnimatePresence>
        {selectedUserId ? (
          <UserDetailDrawer
            userId={selectedUserId}
            onClose={() => setSelectedUserId(null)}
            onChangePlan={(user) => setEditingUser(user)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {editingUser ? (
          <SetPlanModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSuccess={handlePlanSuccess}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
