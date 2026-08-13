'use client';

import { useEffect, useId, useState } from 'react';
import { AlertCircle, Ban, Check, Eye, KeyRound, Loader2, Shield, ShieldOff, UserRound, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { actionLabel, formatAdminDate, roleLabel, type AuditItem, type ControlUser, type UserDetail, type UsersResponse } from '@/lib/admin-control';
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminPagination, AdminPanel } from '@/components/admin/AdminPrimitives';

type ActionKind = 'role' | 'ban' | 'unban' | 'revoke' | 'revoke-all';
type ActionDraft = { kind: ActionKind; user: ControlUser; sessionId?: string };

const actionTitle: Record<ActionKind, string> = {
  role: 'Сменить роль',
  ban: 'Заблокировать пользователя',
  unban: 'Снять блокировку',
  revoke: 'Отозвать сессию',
  'revoke-all': 'Отозвать все сессии',
};

function DetailValue({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  return <div><p className="text-xs text-neutral-500">{label}</p><p className={`mt-1 break-words text-sm font-medium ${tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-red-700' : 'text-neutral-950'}`}>{value}</p></div>;
}

function ActionDialog({ draft, onClose, onDone }: { draft: ActionDraft; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [role, setRole] = useState(draft.user.role === 'admin' ? 'user' : 'admin');
  const titleId = useId();
  const needsReason = draft.kind === 'ban' || draft.kind === 'unban';
  const mutation = useMutation({
    mutationFn: async () => {
      if (draft.kind === 'role') return api.post(`/admin/control/users/${draft.user.id}/role`, { role, confirm: true });
      if (draft.kind === 'ban' || draft.kind === 'unban') return api.post(`/admin/control/users/${draft.user.id}/${draft.kind}`, { reason: reason.trim(), confirm: true });
      if (draft.kind === 'revoke-all') return api.post(`/admin/control/users/${draft.user.id}/sessions/revoke-all`);
      return api.post(`/admin/control/users/${draft.user.id}/sessions/${draft.sessionId}/revoke`);
    },
    onSuccess: () => { toast.success('Изменение применено.'); onDone(); onClose(); },
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !mutation.isPending) onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mutation.isPending, onClose]);
  const error = mutation.error instanceof ApiError ? mutation.error.message : mutation.error instanceof Error ? mutation.error.message : null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-neutral-950/40 p-4" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-md border border-black/10 bg-[var(--landing-paper)] p-5 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-neutral-500">Подтверждение действия</p><h2 id={titleId} className="mt-1 text-xl font-semibold tracking-[-0.02em]">{actionTitle[draft.kind]}</h2></div><button type="button" onClick={onClose} disabled={mutation.isPending} aria-label="Закрыть диалог" className="inline-flex h-9 w-9 items-center justify-center border border-black/10 bg-white disabled:opacity-50"><X size={16} aria-hidden="true" /></button></div>
      <p className="mt-4 break-all text-sm text-neutral-700">{draft.user.email}</p>
      {draft.kind === 'role' ? <label htmlFor="admin-new-role" className="mt-5 block text-sm font-medium">Новая роль<select id="admin-new-role" value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 min-h-11 w-full border border-black/15 bg-white px-3 outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]"><option value="user">user</option><option value="admin">admin</option></select></label> : null}
      {needsReason ? <label htmlFor="admin-action-reason" className="mt-5 block text-sm font-medium">Причина<textarea id="admin-action-reason" autoFocus value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} className="mt-2 min-h-24 w-full resize-y border border-black/15 bg-white p-3 font-normal outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]" placeholder="Кратко опишите основание" /><span className="mt-1 block text-xs font-normal text-neutral-500">Причина сохраняется только как безопасная длина в audit metadata.</span></label> : null}
      {error ? <p className="mt-4 flex gap-2 text-sm text-red-700" role="alert"><AlertCircle size={16} aria-hidden="true" />{error}</p> : null}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={mutation.isPending} className="min-h-10 border border-black/10 bg-white px-4 text-sm font-medium disabled:opacity-50">Отмена</button><button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending || (needsReason && !reason.trim())} className="inline-flex min-h-10 items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{mutation.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}Подтвердить</button></div>
    </section>
  </div>;
}

function UserDetailCard({ userId, onAction }: { userId: string; onAction: (draft: ActionDraft) => void }) {
  const query = useQuery({ queryKey: ['admin-control-user', userId], queryFn: () => api.get(`/admin/control/users/${encodeURIComponent(userId)}`) as Promise<UserDetail>, retry: 1 });
  const user = query.data;
  if (query.isLoading) return <AdminPanel title="Карточка пользователя"><div className="flex min-h-48 items-center justify-center" aria-live="polite"><Loader2 size={18} className="animate-spin" aria-hidden="true" />Загружаю карточку…</div></AdminPanel>;
  if (query.isError || !user) return <AdminPanel title="Карточка пользователя"><AdminErrorState message="Не удалось загрузить карточку пользователя." onRetry={() => void query.refetch()} /></AdminPanel>;
  return <AdminPanel title="Карточка пользователя" subtitle="Данные и операции проходят через server-side Better Auth Admin check." aside={<span className="break-all font-mono text-xs text-neutral-500">{user.id}</span>}>
    <div className="grid gap-6 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><DetailValue label="Email" value={user.email} /><DetailValue label="Проверка email" value={user.email_verified ? 'Подтверждён' : 'Не подтверждён'} tone={user.email_verified ? 'good' : 'bad'} /><DetailValue label="Роль" value={roleLabel(user.role)} /><DetailValue label="Статус" value={user.banned ? 'Заблокирован' : 'Активен'} tone={user.banned ? 'bad' : 'good'} /></div>
      {user.ban_reason ? <div className="border-l-2 border-red-400 bg-red-50 px-3 py-2 text-sm text-red-800"><span className="font-medium">Причина блокировки:</span> {user.ban_reason}</div> : null}
      <div className="flex flex-wrap gap-2 border-t border-black/8 pt-5"><button type="button" onClick={() => onAction({ kind: 'role', user })} className="inline-flex min-h-10 items-center gap-2 border border-black/10 bg-white px-3 text-sm font-medium hover:bg-neutral-50"><Shield size={15} aria-hidden="true" />Сменить роль</button><button type="button" onClick={() => onAction({ kind: user.banned ? 'unban' : 'ban', user })} className="inline-flex min-h-10 items-center gap-2 border border-black/10 bg-white px-3 text-sm font-medium hover:bg-neutral-50">{user.banned ? <ShieldOff size={15} aria-hidden="true" /> : <Ban size={15} aria-hidden="true" />}{user.banned ? 'Снять блокировку' : 'Заблокировать'}</button><button type="button" onClick={() => onAction({ kind: 'revoke-all', user })} disabled={!user.sessions.length} className="inline-flex min-h-10 items-center gap-2 border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-800 disabled:cursor-not-allowed disabled:opacity-50"><KeyRound size={15} aria-hidden="true" />Отозвать все сессии</button></div>
      <div><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-sm font-semibold">Активные сессии ({user.sessions.length})</h3><span className="text-xs text-neutral-500">Последняя активность: {user.last_activity ? formatAdminDate(user.last_activity) : '—'}</span></div>{user.sessions.length ? <div className="mt-3 grid gap-2">{user.sessions.map((session) => <div key={session.id} className="flex flex-col gap-3 border border-black/10 bg-neutral-50 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-all font-mono text-xs text-neutral-700">{session.id}</p><p className="mt-1 break-words text-xs text-neutral-500">{session.user_agent || 'User-Agent не указан'} · до {formatAdminDate(session.expires_at)}</p></div><button type="button" onClick={() => onAction({ kind: 'revoke', user, sessionId: session.id })} className="min-h-10 shrink-0 border border-black/10 bg-white px-3 text-xs font-semibold hover:bg-neutral-50">Отозвать</button></div>)}</div> : <p className="mt-3 text-sm text-neutral-500">Активных сессий нет.</p>}</div>
      <div><h3 className="text-sm font-semibold">История пользователя</h3>{user.audit.length ? <div className="mt-3 divide-y divide-black/8 border-y border-black/8">{user.audit.map((event, index) => <div key={`${event.timestamp}-${event.action}-${index}`} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span>{actionLabel(event.action)}</span><span className="text-xs text-neutral-500">{formatAdminDate(event.timestamp)} · {event.outcome === 'success' ? 'Успешно' : 'Отклонено'}</span></div>)}</div> : <p className="mt-3 text-sm text-neutral-500">Операций для этого пользователя пока нет.</p>}</div>
    </div>
  </AdminPanel>;
}

function UserRow({ user, onSelect }: { user: ControlUser; onSelect: () => void }) {
  return <div className="border border-black/10 bg-white p-4"><div className="flex items-start justify-between gap-3"><button type="button" onClick={onSelect} className="min-w-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"><span className="block break-words text-sm font-semibold">{user.name || 'Без имени'}</span><span className="mt-1 block break-all text-sm text-neutral-600">{user.email}</span></button><button type="button" onClick={onSelect} aria-label={`Открыть карточку ${user.email}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-black/10 bg-white"><Eye size={15} aria-hidden="true" /></button></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500"><span>Роль: {roleLabel(user.role)}</span><span className={user.banned ? 'text-red-700' : 'text-emerald-700'}>{user.banned ? 'Заблокирован' : 'Активен'}</span><span>Сессий: {user.active_sessions}</span></div></div>;
}

function AuditList({ events }: { events: AuditItem[] }) {
  if (!events.length) return <AdminEmptyState icon={UserRound} title="Событий пока нет" description="Операции появятся после первого действия администратора." />;
  return <div className="divide-y divide-black/8">{events.map((event, index) => <div key={`${event.timestamp}-${event.action}-${index}`} className="grid gap-1 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4"><div><p className="text-sm font-medium">{actionLabel(event.action)}</p><p className="mt-1 break-all font-mono text-xs text-neutral-500">{event.target || '—'}</p></div><div className="text-left text-xs text-neutral-500 sm:text-right"><p>{formatAdminDate(event.timestamp)}</p><p className={event.outcome === 'success' ? 'text-emerald-700' : 'text-red-700'}>{event.outcome === 'success' ? 'Успешно' : 'Отклонено'}</p></div></div>)}</div>;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'email'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActionDraft | null>(null);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin-control-users', search, page, sortBy, sortDirection], queryFn: () => api.get(`/admin/control/users?page=${page}&per_page=20&sort_by=${sortBy}&sort_direction=${sortDirection}${search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ''}`) as Promise<UsersResponse>, retry: 1 });
  const audit = useQuery({ queryKey: ['admin-control-audit'], queryFn: () => api.get('/admin/control/audit?per_page=12') as Promise<{ items: AuditItem[] }>, retry: 1 });
  const items = query.data?.items ?? [];
  const onActionDone = () => {
    void query.refetch();
    void audit.refetch();
    if (selectedId) void queryClient.invalidateQueries({ queryKey: ['admin-control-user', selectedId] });
  };

  return <>
    <AdminPageHeader eyebrow="Администрирование / пользователи" title="Пользователи" description="Поиск, доступ и сессии. Каждое изменение подтверждается и записывается в audit trail." index="02" />
    <div className="mt-6 grid gap-5">
      <AdminPanel title="Список пользователей" subtitle={query.data ? `${query.data.total.toLocaleString('ru-RU')} записей · страница ${query.data.page} из ${query.data.pages}` : 'Данные загружаются через Better Auth Admin API.'}>
        <div className="flex flex-col gap-3 border-b border-black/8 p-4 sm:flex-row sm:items-end sm:p-5"><label htmlFor="admin-user-search" className="min-w-0 flex-1 text-sm font-medium">Поиск по email<input id="admin-user-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Например, user@example.com" className="mt-2 min-h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]" /></label><label htmlFor="admin-user-sort" className="text-sm font-medium">Сортировка<select id="admin-user-sort" value={`${sortBy}:${sortDirection}`} onChange={(event) => { const [nextBy, nextDirection] = event.target.value.split(':') as ['createdAt' | 'updatedAt' | 'email', 'asc' | 'desc']; setSortBy(nextBy); setSortDirection(nextDirection); setPage(1); }} className="mt-2 min-h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]"><option value="createdAt:desc">Сначала новые</option><option value="createdAt:asc">Сначала старые</option><option value="updatedAt:desc">Недавно изменённые</option><option value="email:asc">Email А–Я</option></select></label></div>
        {query.isLoading ? <div className="grid gap-2 p-4 sm:p-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-20 animate-pulse border border-black/10 bg-neutral-50" />)}</div> : query.isError ? <AdminErrorState message="Не удалось загрузить список пользователей." onRetry={() => void query.refetch()} /> : items.length === 0 ? <AdminEmptyState icon={UserRound} title="Пользователи не найдены" description={search ? 'Измените поисковый запрос и повторите.' : 'В Better Auth пока нет пользователей.'} /> : <>
          <div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead className="border-b border-black/10 bg-neutral-50 text-xs text-neutral-500"><tr><th scope="col" className="px-5 py-3 font-medium">Пользователь</th><th scope="col" className="px-5 py-3 font-medium">Email</th><th scope="col" className="px-5 py-3 font-medium">Роль</th><th scope="col" className="px-5 py-3 font-medium">Статус</th><th scope="col" className="px-5 py-3 font-medium">Сессии</th><th scope="col" className="px-5 py-3 font-medium">Последняя активность</th><th scope="col" className="px-5 py-3"><span className="sr-only">Открыть</span></th></tr></thead><tbody>{items.map((user) => <tr key={user.id} className="border-b border-black/8 align-top last:border-0"><td className="px-5 py-4"><button type="button" onClick={() => setSelectedId(user.id)} className="text-left font-medium underline decoration-black/20 underline-offset-4 hover:decoration-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]">{user.name || 'Без имени'}</button></td><td className="max-w-[280px] break-all px-5 py-4 text-neutral-700">{user.email}</td><td className="px-5 py-4">{roleLabel(user.role)}</td><td className={`px-5 py-4 ${user.banned ? 'text-red-700' : 'text-emerald-700'}`}>{user.banned ? 'Заблокирован' : 'Активен'}</td><td className="px-5 py-4">{user.active_sessions}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-neutral-500">{formatAdminDate(user.last_activity)}</td><td className="px-5 py-4"><button type="button" onClick={() => setSelectedId(user.id)} aria-label={`Открыть карточку ${user.email}`} className="inline-flex h-9 w-9 items-center justify-center border border-black/10 bg-white"><Eye size={15} aria-hidden="true" /></button></td></tr>)}</tbody></table></div>
          <div className="grid gap-2 p-4 md:hidden"><p className="mb-1 text-xs text-neutral-500">{query.data?.total.toLocaleString('ru-RU')} записей</p>{items.map((user) => <UserRow key={user.id} user={user} onSelect={() => setSelectedId(user.id)} />)}</div>
          <AdminPagination page={query.data?.page ?? page} pages={query.data?.pages ?? 1} total={query.data?.total ?? 0} onPageChange={setPage} />
        </>}
      </AdminPanel>
      {selectedId ? <div className="relative"><button type="button" onClick={() => setSelectedId(null)} className="absolute right-4 top-3 z-10 inline-flex h-9 w-9 items-center justify-center border border-black/10 bg-white" aria-label="Закрыть карточку"><X size={15} aria-hidden="true" /></button><UserDetailCard userId={selectedId} onAction={setDraft} /></div> : null}
      <AdminPanel title="Audit trail" subtitle="Последние операции администраторов. События хранятся внутри PeakTalk.">{audit.isLoading ? <div className="h-32 animate-pulse bg-neutral-50" /> : audit.isError ? <AdminErrorState message="Audit trail недоступен." onRetry={() => void audit.refetch()} /> : <AuditList events={audit.data?.items ?? []} />}</AdminPanel>
    </div>
    {draft ? <ActionDialog draft={draft} onClose={() => setDraft(null)} onDone={onActionDone} /> : null}
  </>;
}
