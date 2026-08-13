'use client';

import Link from 'next/link';
import { AlertCircle, ArrowRight, Loader2, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AdminMetricCard, AdminPageHeader, AdminPanel } from '@/components/admin/AdminPrimitives';

type Stats = { total_users: number; total_simulations: number; simulations_today: number; paying_users: number };

export default function AdminOverviewPage() {
  const query = useQuery({ queryKey: ['admin-overview-stats'], queryFn: () => api.get('/admin/stats') as Promise<Stats>, retry: 1 });
  return <>
    <AdminPageHeader eyebrow="Admin / Overview" title="Операционный контур" description="Закрытая точка контроля доступа. Управление пользователями находится в единственном разрешённом control room." index="01" actions={<Link href="/admin/users" className="inline-flex min-h-11 items-center gap-2 border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white">Открыть пользователей <ArrowRight size={15} /></Link>} />
    <div className="mt-6 grid gap-6">
      {query.isLoading ? <AdminPanel title="Сводка"><div className="flex min-h-40 items-center justify-center"><Loader2 className="animate-spin" /></div></AdminPanel> : query.isError ? <AdminPanel title="Сводка"><div className="flex items-center gap-3 px-6 py-12 text-sm text-red-700"><AlertCircle size={18} />Сводка недоступна.</div></AdminPanel> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><AdminMetricCard label="Пользователи" value={String(query.data?.total_users ?? 0)} helper="Переход к карточкам и сессиям" icon={Users} /><AdminMetricCard label="Платящие" value={String(query.data?.paying_users ?? 0)} helper="Только просмотр статистики" icon={Users} /><AdminMetricCard label="Симуляции" value={String(query.data?.total_simulations ?? 0)} helper="За весь период" icon={Users} /><AdminMetricCard label="Сегодня" value={String(query.data?.simulations_today ?? 0)} helper="UTC" icon={Users} /></div>}
      <AdminPanel title="Границы доступа" subtitle="Разрешены просмотр/поиск, ban/unban с причиной, отзыв сессий и смена роли с подтверждением. Impersonation, удаление и смена пароля отключены."><div className="grid gap-3 p-5 text-sm text-neutral-700 sm:grid-cols-2 sm:p-6"><div className="border border-black/10 bg-white p-4"><p className="font-semibold text-neutral-950">Server-enforced RBAC</p><p className="mt-1 leading-6">Каждый API-запрос проверяет Better Auth Admin role; UI guard не является границей безопасности.</p></div><div className="border border-black/10 bg-white p-4"><p className="font-semibold text-neutral-950">Audit trail</p><p className="mt-1 leading-6">Изменения фиксируются внутри PeakTalk с безопасными metadata без токенов и секретов.</p></div></div></AdminPanel>
    </div>
  </>;
}
