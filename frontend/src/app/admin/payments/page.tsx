'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  CreditCard,
  Loader2,
  ReceiptText,
  TrendingUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  formatAdminCurrency,
  formatAdminDateTime,
} from '@/lib/admin';
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  AdminPaymentBadge,
} from '@/components/admin/AdminPrimitives';
import type { AdminPaymentsResponse } from '@/types/admin';
import type { PaymentStatus } from '@/types/billing';

const STATUS_FILTERS: Array<{ id: 'all' | PaymentStatus; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'succeeded', label: 'Оплачено' },
  { id: 'pending', label: 'Ожидание' },
  { id: 'failed', label: 'Ошибка' },
  { id: 'refunded', label: 'Возврат' },
  { id: 'cancelled', label: 'Отменено' },
];

function TransactionIdCell({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const shortId = id.length > 16 ? `${id.slice(0, 10)}…${id.slice(-4)}` : id;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Не удалось скопировать идентификатор.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group inline-flex items-center gap-2 font-mono text-[12px] text-neutral-700 transition-colors hover:text-neutral-950"
      title={id}
    >
      <span>{shortId}</span>
      {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />}
    </button>
  );
}

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');

  const { data, isLoading, isError, error } = useQuery<AdminPaymentsResponse>({
    queryKey: ['admin-payments', page, statusFilter],
    queryFn: () =>
      api.get(
        `/admin/payments?page=${page}&per_page=20${
          statusFilter !== 'all' ? `&status=${encodeURIComponent(statusFilter)}` : ''
        }`,
      ),
    staleTime: 30_000,
    retry: 1,
  });

  const pageStats = useMemo(() => {
    const items = data?.items ?? [];
    const successful = items.filter((item) => item.status === 'succeeded');
    const pending = items.filter((item) => item.status === 'pending').length;
    const exceptional = items.filter((item) => item.status === 'failed' || item.status === 'refunded').length;

    return {
      visibleRevenue: successful.reduce((sum, item) => sum + item.amount, 0),
      successfulCount: successful.length,
      pending,
      exceptional,
    };
  }, [data?.items]);

  return (
    <div className="space-y-6 pb-10">
      <AdminPageHeader
        eyebrow="Operations / Payments"
        title="Поток оплат без вымышленных тарифных колонок."
        description="Список транзакций теперь показывает только то, что реально хранится в системе: клиент, сумма, статус, описание и YooKassa ID. Ложный plan-column убран."
        index="03"
      />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: 'Транзакций найдено',
            value: (data?.total ?? 0).toLocaleString('ru-RU'),
            helper: statusFilter === 'all' ? 'Общий объём списка.' : `С учётом фильтра ${statusFilter}.`,
          },
          {
            label: 'Успешно на странице',
            value: pageStats.successfulCount.toLocaleString('ru-RU'),
            helper: 'Количество successful в текущей выдаче.',
          },
          {
            label: 'Сумма на странице',
            value: formatAdminCurrency(pageStats.visibleRevenue),
            helper: 'Считает только оплаченные транзакции текущей страницы.',
          },
          {
            label: 'Проблемные записи',
            value: (pageStats.pending + pageStats.exceptional).toLocaleString('ru-RU'),
            helper: `${pageStats.pending.toLocaleString('ru-RU')} pending и ${pageStats.exceptional.toLocaleString('ru-RU')} failed/refunded.`,
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
        title="Transactions"
        subtitle="Фильтрация по реальному payment status. Данные читаются напрямую из admin payments endpoint."
        aside={
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => {
              const active = filter.id === statusFilter;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(filter.id);
                    setPage(1);
                  }}
                  className={`inline-flex min-h-10 items-center border px-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                    active
                      ? 'border-neutral-950 bg-neutral-950 text-white'
                      : 'border-black/10 bg-white text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
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
            <p>{error instanceof Error ? error.message : 'Не удалось загрузить платежи.'}</p>
          </div>
        ) : null}

        {data && !isLoading ? (
          <>
            {data.items.length === 0 ? (
              <AdminEmptyState
                icon={CreditCard}
                title="Платежи не найдены"
                description="Для выбранного фильтра пока нет записей. Попробуйте снять фильтр или проверьте backend."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead>
                    <tr className="border-b border-black/8 bg-[rgba(17,24,39,0.03)]">
                      {['Дата', 'Клиент', 'Сумма', 'Статус', 'Описание', 'YooKassa ID'].map((column) => (
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
                    {data.items.map((payment) => {
                      const dateTime = formatAdminDateTime(payment.created_at);

                      return (
                        <tr key={payment.id} className="border-b border-black/6 bg-white transition-colors hover:bg-[rgba(17,24,39,0.03)]">
                          <td className="px-5 py-4 sm:px-6">
                            <div>
                              <p className="text-sm font-semibold text-neutral-950">{dateTime.date}</p>
                              <p className="mt-1 text-xs text-neutral-500">{dateTime.time}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 sm:px-6">
                            <div className="max-w-[220px]">
                              <p className="truncate text-sm font-semibold text-neutral-950">{payment.user_email ?? 'Пользователь удалён'}</p>
                              <p className="mt-1 text-xs text-neutral-500">txn: {payment.id.slice(0, 8)}…</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-neutral-950 sm:px-6">
                            {formatAdminCurrency(payment.amount)}
                            <span className="ml-1 text-xs font-medium uppercase text-neutral-500">{payment.currency}</span>
                          </td>
                          <td className="px-5 py-4 sm:px-6">
                            <AdminPaymentBadge status={payment.status} />
                          </td>
                          <td className="px-5 py-4 sm:px-6">
                            <div className="max-w-[260px] text-sm leading-6 text-neutral-700">
                              {payment.description ?? 'Описание отсутствует'}
                            </div>
                          </td>
                          <td className="px-5 py-4 sm:px-6">
                            <TransactionIdCell id={payment.yookassa_payment_id} />
                          </td>
                        </tr>
                      );
                    })}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border border-black/10 bg-white px-5 py-5 shadow-[0_18px_60px_rgba(17,24,39,0.05)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center border border-black/10 bg-[rgba(17,24,39,0.03)] text-neutral-700">
              <ReceiptText size={18} />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-neutral-500">Operational Note</p>
              <p className="mt-2 text-sm leading-7 text-neutral-700">
                Возвраты и детализация платёжного метода по-прежнему должны проверяться в YooKassa. В админке остаётся только то, что реально синхронизировано с backend.
              </p>
            </div>
          </div>
        </div>

        <div className="border border-black/10 bg-white px-5 py-5 shadow-[0_18px_60px_rgba(17,24,39,0.05)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center border border-black/10 bg-[rgba(232,96,10,0.08)] text-[#9a4307]">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-neutral-500">Why This Changed</p>
              <p className="mt-2 text-sm leading-7 text-neutral-700">
                Старый экран делал вид, что знает план платежа даже там, где данных не было. Теперь UI не додумывает модель данных и не вводит в заблуждение.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
