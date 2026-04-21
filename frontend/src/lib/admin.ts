import type { AdminPlanId } from '@/types/admin';
import type { PaymentStatus } from '@/types/billing';

export const ADMIN_PLAN_META: Record<
  AdminPlanId,
  { label: string; className: string }
> = {
  free: {
    label: 'Free',
    className: 'border-neutral-200 bg-neutral-100 text-neutral-700',
  },
  per_session: {
    label: '1 Session',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  personal: {
    label: 'Personal',
    className: 'border-[rgba(232,96,10,0.22)] bg-[rgba(232,96,10,0.08)] text-[#9a4307]',
  },
  pro: {
    label: 'Pro',
    className: 'border-neutral-900 bg-neutral-900 text-white',
  },
  team: {
    label: 'Team',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  starter: {
    label: 'Starter',
    className: 'border-neutral-300 bg-white text-neutral-800',
  },
};

export const SUBSCRIPTION_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: 'Активна',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  cancelled: {
    label: 'Отменена',
    className: 'border-neutral-200 bg-neutral-100 text-neutral-600',
  },
  past_due: {
    label: 'Просрочена',
    className: 'border-red-200 bg-red-50 text-red-700',
  },
  trialing: {
    label: 'Триал',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
  },
};

export const PAYMENT_STATUS_META: Record<
  PaymentStatus | string,
  { label: string; className: string }
> = {
  pending: {
    label: 'Ожидание',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  succeeded: {
    label: 'Оплачен',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  failed: {
    label: 'Ошибка',
    className: 'border-red-200 bg-red-50 text-red-700',
  },
  cancelled: {
    label: 'Отменён',
    className: 'border-neutral-200 bg-neutral-100 text-neutral-600',
  },
  refunded: {
    label: 'Возврат',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
  },
};

export function formatAdminCurrency(value: number | string) {
  const amount = Number(value) || 0;
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

export function formatAdminDate(value: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

export function formatAdminDateTime(value: string | null) {
  if (!value) {
    return {
      date: '—',
      time: '—',
    };
  }

  const date = new Date(value);

  return {
    date: date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}
