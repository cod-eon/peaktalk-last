'use client';

import Link from 'next/link';
import { ArrowLeft, Ban, KeyRound, Shield, ShieldOff, UserRound } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { actionLabel, formatAdminDate, roleLabel, type AuditItem, type UserDetail } from '@/lib/admin-control';
import { AdminActionDialog, type AdminActionDraft } from '@/components/admin/AdminActionDialog';
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminPanel } from '@/components/admin/AdminPrimitives';

function DetailValue({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return <div><p className="text-xs text-neutral-500">{label}</p><p className={`mt-1 break-words text-sm font-medium ${tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-red-700' : 'text-neutral-950'}`}>{value}</p></div>;
}

function AuditList({ events }: { events: AuditItem[] }) {
  if (!events.length) return <AdminEmptyState icon={UserRound} title="История пока пустая" description="Действия администратора появятся после первой операции." />;
  return <div className="divide-y divide-black/8">{events.map((event, index) => <div key={`${event.timestamp}-${event.action}-${index}`} className="grid gap-1 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"><div><p className="text-sm font-medium">{actionLabel(event.action)}</p><p className="mt-1 break-all font-mono text-xs text-neutral-500">{event.actor}</p></div><div className="text-left text-xs text-neutral-500 sm:text-right"><p>{formatAdminDate(event.timestamp)}</p><p className={event.outcome === 'success' ? 'text-emerald-700' : 'text-red-700'}>{event.outcome === 'success' ? 'Успешно' : 'Отклонено'}</p></div></div>)}</div>;
}

function detailErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Сессия истекла. Войдите снова.';
    if (error.status === 403) return 'Недостаточно прав для просмотра пользователя.';
    if (error.status >= 500) return 'Сервис авторизации временно недоступен.';
    if (error.message && error.message !== 'Произошла ошибка') return error.message;
  }
  return 'Не удалось загрузить пользователя. Проверьте соединение и повторите запрос.';
}

export default function AdminUserPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [draft, setDraft] = useState<AdminActionDraft | null>(null);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin-control-user', userId], queryFn: () => api.get(`/admin/control/users/${encodeURIComponent(userId)}`) as Promise<UserDetail>, retry: 1, enabled: Boolean(userId) });
  const user = query.data;
  const onActionDone = () => {
    void query.refetch();
    void queryClient.invalidateQueries({ queryKey: ['admin-control-users'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-control-overview'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-control-auth'] });
  };

  if (query.isLoading || !userId) return <div className="grid min-h-64 place-items-center text-sm text-neutral-600" aria-live="polite">Загружаем пользователя...</div>;
  if (query.isError || !user) return <><Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"><ArrowLeft size={15} aria-hidden="true" />К списку пользователей</Link><div className="mt-5"><AdminErrorState message={detailErrorMessage(query.error)} onRetry={() => void query.refetch()} /></div></>;

  return <>
    <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"><ArrowLeft size={15} aria-hidden="true" />К списку пользователей</Link>
    <div className="mt-5"><AdminPageHeader eyebrow="Пользователь" title={user.name || 'Без имени'} description={user.email} index="02" /></div>
    <div className="mt-6 grid gap-5">
      <AdminPanel title="Состояние доступа" subtitle={`ID: ${user.id}`}>
        <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6"><DetailValue label="Email" value={user.email} /><DetailValue label="Email подтверждён" value={user.email_verified ? 'Да' : 'Нет'} tone={user.email_verified ? 'good' : 'bad'} /><DetailValue label="Роль" value={roleLabel(user.role)} /><DetailValue label="Статус" value={user.banned ? 'Заблокирован' : 'Активен'} tone={user.banned ? 'bad' : 'good'} /></div>
        {user.ban_reason ? <div className="mx-5 mb-5 border-l-2 border-red-400 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6"><span className="font-medium">Причина блокировки:</span> {user.ban_reason}</div> : null}
        <div className="flex flex-wrap gap-2 border-t border-black/8 p-5 sm:p-6"><button type="button" onClick={() => setDraft({ kind: 'role', user })} className="inline-flex min-h-10 items-center gap-2 border border-black/10 bg-white px-3 text-sm font-medium hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"><Shield size={15} aria-hidden="true" />Сменить роль</button><button type="button" onClick={() => setDraft({ kind: user.banned ? 'unban' : 'ban', user })} className="inline-flex min-h-10 items-center gap-2 border border-black/10 bg-white px-3 text-sm font-medium hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]">{user.banned ? <ShieldOff size={15} aria-hidden="true" /> : <Ban size={15} aria-hidden="true" />}{user.banned ? 'Снять блокировку' : 'Заблокировать'}</button><button type="button" onClick={() => setDraft({ kind: 'revoke-all', user })} disabled={!user.sessions.length} className="inline-flex min-h-10 items-center gap-2 border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"><KeyRound size={15} aria-hidden="true" />Отозвать все сессии</button></div>
      </AdminPanel>

      <AdminPanel title={`Активные сессии: ${user.sessions.length}`} subtitle={`Последняя активность: ${formatAdminDate(user.last_activity)}`}>
        {user.sessions.length ? <div className="divide-y divide-black/8">{user.sessions.map((session) => <div key={session.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="min-w-0"><p className="break-all font-mono text-xs text-neutral-700">{session.id}</p><p className="mt-1 break-words text-xs text-neutral-500">{session.user_agent || 'User-Agent не указан'}. До {formatAdminDate(session.expires_at)}</p></div><button type="button" onClick={() => setDraft({ kind: 'revoke', user, sessionId: session.id })} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-black/10 bg-white px-3 text-xs font-semibold hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"><KeyRound size={14} aria-hidden="true" />Отозвать</button></div>)}</div> : <div className="p-5 sm:p-6"><p className="text-sm text-neutral-500">Активных сессий нет.</p></div>}
      </AdminPanel>

      <AdminPanel title="История действий" subtitle="Изменения доступа для этого пользователя."><AuditList events={user.audit} /></AdminPanel>
    </div>
    {draft ? <AdminActionDialog draft={draft} onClose={() => setDraft(null)} onDone={onActionDone} /> : null}
  </>;
}
