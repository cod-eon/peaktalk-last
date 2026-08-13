'use client';

import { CheckCircle2, Clock3, KeyRound, ShieldAlert, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { actionLabel, formatAdminDate, type AuthResponse } from '@/lib/admin-control';
import { AdminEmptyState, AdminErrorState, AdminMetricCard, AdminPageHeader, AdminPanel } from '@/components/admin/AdminPrimitives';

export default function AdminAuthPage() {
  const query = useQuery({ queryKey: ['admin-control-auth'], queryFn: () => api.get('/admin/control/auth') as Promise<AuthResponse>, retry: 1 });
  const data = query.data;

  return <>
    <AdminPageHeader eyebrow="Доступ" title="Авторизация" description="Состояние Better Auth, регистрации, сессий и журнала действий." index="03" />
    <div className="mt-6 grid gap-5">
      {query.isLoading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-32 animate-pulse border border-black/10 bg-white" />)}</div> : query.isError || !data ? <AdminPanel title="Состояние auth"><AdminErrorState message="Не удалось загрузить состояние авторизации." onRetry={() => void query.refetch()} /></AdminPanel> : <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard label="Провайдер" value={data.provider} helper={`Статус: ${data.status}`} icon={KeyRound} />
          <AdminMetricCard label="Email подтверждены" value={data.stats.verified_users.toLocaleString('ru-RU')} helper="Пользователи с подтверждённым адресом" icon={CheckCircle2} />
          <AdminMetricCard label="Активные сессии" value={data.stats.active_sessions.toLocaleString('ru-RU')} helper="Сессии с актуальным сроком" icon={Users} />
          <AdminMetricCard label="Заблокированы" value={data.stats.banned_users.toLocaleString('ru-RU')} helper="Пользователи с блокировкой" icon={ShieldAlert} />
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <AdminPanel title="Безопасная конфигурация" subtitle="Только безопасные признаки. Секреты и доступы здесь не показываются.">
            <dl className="divide-y divide-black/8">{Object.entries(data.safe_config).map(([key, value]) => <div key={key} className="grid gap-1 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"><dt className="break-words text-sm text-neutral-700">{key}</dt><dd className="text-sm font-medium text-neutral-950">{typeof value === 'boolean' ? (value ? 'Да' : 'Нет') : value}</dd></div>)}</dl>
          </AdminPanel>
          <AdminPanel title="Последние изменения доступа" subtitle="Роли, сессии и блокировки.">
            {data.recent_events.length ? <div className="divide-y divide-black/8">{data.recent_events.map((event, index) => <div key={`${event.timestamp}-${event.action}-${index}`} className="grid gap-1 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"><div><p className="text-sm font-medium">{actionLabel(event.action)}</p><p className="mt-1 break-all font-mono text-xs text-neutral-500">{event.target || 'Нет данных'} · {formatAdminDate(event.timestamp)}</p></div><span className={`text-xs font-semibold ${event.outcome === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{event.outcome === 'success' ? 'Успешно' : 'Отклонено'}</span></div>)}</div> : <AdminEmptyState icon={Clock3} title="Событий пока нет" description="История появится после административной операции." />}
          </AdminPanel>
        </div>
      </>}
    </div>
  </>;
}
