'use client';

import Link from 'next/link';
import { Activity, ArrowRight, CheckCircle2, Clock3, ShieldAlert, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { actionLabel, formatAdminDate, type AuditItem, type OverviewResponse } from '@/lib/admin-control';
import { AdminEmptyState, AdminErrorState, AdminMetricCard, AdminPageHeader, AdminPanel } from '@/components/admin/AdminPrimitives';

function AuditTable({ events }: { events: AuditItem[] }) {
  if (!events.length) return <AdminEmptyState icon={Clock3} title="Событий пока нет" description="Административные действия появятся здесь после первой операции." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="border-b border-black/10 bg-neutral-50 text-xs text-neutral-500"><tr><th scope="col" className="px-5 py-3 font-medium">Время</th><th scope="col" className="px-5 py-3 font-medium">Действие</th><th scope="col" className="px-5 py-3 font-medium">Target</th><th scope="col" className="px-5 py-3 font-medium">Результат</th></tr></thead>
        <tbody>{events.map((event, index) => <tr key={`${event.timestamp}-${event.action}-${index}`} className="border-b border-black/8 last:border-0"><td className="whitespace-nowrap px-5 py-3 text-xs text-neutral-500">{formatAdminDate(event.timestamp)}</td><td className="px-5 py-3 font-medium">{actionLabel(event.action)}</td><td className="max-w-[220px] break-all px-5 py-3 font-mono text-xs text-neutral-600">{event.target || '—'}</td><td className={`px-5 py-3 text-xs font-semibold ${event.outcome === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{event.outcome === 'success' ? 'Успешно' : 'Отклонено'}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export default function AdminOverviewPage() {
  const query = useQuery({ queryKey: ['admin-control-overview'], queryFn: () => api.get('/admin/control/overview') as Promise<OverviewResponse>, retry: 1 });
  const stats = query.data?.stats;

  return <>
    <AdminPageHeader eyebrow="Администрирование / обзор" title="Операционное состояние" description="Реальные данные доступа, сессий и административных действий внутри PeakTalk." index="01" actions={<><Link href="/admin/users" className="inline-flex min-h-10 items-center gap-2 border border-neutral-950 bg-neutral-950 px-3 text-sm font-semibold text-white hover:bg-neutral-800">Пользователи <ArrowRight size={15} aria-hidden="true" /></Link><Link href="/admin/auth" className="inline-flex min-h-10 items-center gap-2 border border-black/10 bg-white px-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50">Доступ и auth</Link></>} />
    <div className="mt-6 grid gap-5">
      {query.isLoading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-32 animate-pulse border border-black/10 bg-white" />)}</div> : query.isError || !stats ? <AdminPanel title="Сводка"><AdminErrorState message="Не удалось загрузить операционную сводку." onRetry={() => void query.refetch()} /></AdminPanel> : <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard label="Всего пользователей" value={stats.total_users.toLocaleString('ru-RU')} helper="Текущий auth inventory" icon={Users} />
          <AdminMetricCard label="Новые за 24 часа" value={stats.new_users_24h.toLocaleString('ru-RU')} helper="Регистрации по Better Auth" icon={Activity} />
          <AdminMetricCard label="Email подтверждён" value={stats.verified_users.toLocaleString('ru-RU')} helper={`${stats.unverified_users.toLocaleString('ru-RU')} ещё ожидают`} icon={CheckCircle2} />
          <AdminMetricCard label="Активные сессии" value={stats.active_sessions.toLocaleString('ru-RU')} helper="Неистёкшие сессии" icon={ShieldAlert} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <AdminMetricCard label="Новые за 7 дней" value={stats.new_users_7d.toLocaleString('ru-RU')} helper="Регистрации" icon={Activity} />
          <AdminMetricCard label="Новые за 30 дней" value={stats.new_users_30d.toLocaleString('ru-RU')} helper="Регистрации" icon={Activity} />
          <AdminMetricCard label="Заблокированные" value={stats.banned_users.toLocaleString('ru-RU')} helper="Требуют внимания" icon={ShieldAlert} />
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <AdminPanel title="Распределение ролей" subtitle="Источник: Better Auth user inventory.">
            {Object.keys(stats.role_distribution).length ? <div className="divide-y divide-black/8">{Object.entries(stats.role_distribution).map(([role, count]) => <div key={role} className="flex items-center justify-between px-5 py-4 text-sm"><span className="font-medium">{role}</span><span className="font-mono text-neutral-600">{count.toLocaleString('ru-RU')}</span></div>)}</div> : <AdminEmptyState icon={Users} title="Данных нет" description="Роли появятся после регистрации пользователей." />}
          </AdminPanel>
          <AdminPanel title="Последние административные действия" subtitle="Только allowlisted metadata; cookies и session tokens не попадают в ответ."><AuditTable events={query.data?.recent_events ?? []} /></AdminPanel>
        </div>
      </>}
    </div>
  </>;
}
