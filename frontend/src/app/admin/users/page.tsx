'use client';

import { useState } from 'react';
import { AlertCircle, Ban, Clock3, Eye, KeyRound, Loader2, Search, Shield, ShieldOff, UserRound, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { AdminEmptyState, AdminPageHeader, AdminPagination, AdminPanel } from '@/components/admin/AdminPrimitives';

type ControlUser = {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  role: string | null;
  banned: boolean;
  ban_reason: string | null;
  ban_expires: string | null;
  created_at: string | null;
  updated_at: string | null;
};
type Session = { id: string; created_at: string | null; expires_at: string | null; user_agent: string | null };
type UserDetail = ControlUser & { sessions: Session[] };
type UsersResponse = { items: ControlUser[]; total: number; page: number; per_page: number; pages: number };
type AuditResponse = { items: Array<{ actor: string; target: string | null; action: string; outcome: string; timestamp: string; metadata: Record<string, unknown> }>; total: number; pages: number };
type ActionDraft = { kind: 'role' | 'ban' | 'unban'; user: ControlUser; role?: string };

function formatDate(value: string | null) {
  if (!value) return '—';
  try { return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); } catch { return value; }
}

function roleLabel(role: string | null) {
  return role?.split(',').map((item) => item.trim()).filter(Boolean).join(', ') || 'user';
}

function ActionDialog({ draft, onClose, onDone }: { draft: ActionDraft; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [role, setRole] = useState(draft.role ?? (draft.user.role === 'admin' ? 'user' : 'admin'));
  const mutation = useMutation({
    mutationFn: async () => {
      if (draft.kind === 'role') return api.post(`/admin/control/users/${draft.user.id}/role`, { role, confirm: true });
      return api.post(`/admin/control/users/${draft.user.id}/${draft.kind}`, { reason: reason.trim(), confirm: true });
    },
    onSuccess: () => { toast.success('Изменение применено.'); onDone(); onClose(); },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Не удалось применить изменение.'),
  });
  const needsReason = draft.kind !== 'role';
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral-950/45 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="admin-action-title" className="w-full max-w-lg border border-black/10 bg-[#f5f1ea] p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neutral-500">Подтверждение</p><h2 id="admin-action-title" className="mt-2 font-syne text-3xl tracking-[-0.05em]">{draft.kind === 'role' ? 'Сменить роль' : draft.kind === 'ban' ? 'Заблокировать пользователя' : 'Снять блокировку'}</h2></div>
          <button type="button" onClick={onClose} aria-label="Закрыть диалог" className="inline-flex h-10 w-10 items-center justify-center border border-black/10 bg-white"><X size={16} /></button>
        </div>
        <p className="mt-4 break-words text-sm text-neutral-700">{draft.user.email}</p>
        {draft.kind === 'role' ? <label className="mt-6 block text-sm font-semibold">Новая роль<select value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 block min-h-11 w-full border border-black/10 bg-white px-3"><option value="user">user</option><option value="admin">admin</option></select></label> : <label className="mt-6 block text-sm font-semibold">Причина<textarea autoFocus value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-28 w-full resize-y border border-black/10 bg-white p-3 font-normal outline-none focus:border-neutral-950" maxLength={500} placeholder="Кратко опишите основание" /></label>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="min-h-11 border border-black/10 bg-white px-4 text-sm font-semibold">Отмена</button><button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending || (needsReason && !reason.trim())} className="inline-flex min-h-11 items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{mutation.isPending && <Loader2 size={15} className="animate-spin" />}Подтвердить</button></div>
      </section>
    </div>
  );
}

function UserDetailCard({ userId, onAction }: { userId: string; onAction: (draft: ActionDraft) => void }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin-control-user', userId], queryFn: () => api.get(`/admin/control/users/${userId}`) as Promise<UserDetail>, retry: 1 });
  const revoke = useMutation({ mutationFn: (path: string) => api.post(path), onSuccess: () => { toast.success('Сессия отозвана.'); void queryClient.invalidateQueries({ queryKey: ['admin-control-user', userId] }); }, onError: (error) => toast.error(error instanceof Error ? error.message : 'Не удалось отозвать сессию.') });
  if (query.isLoading) return <AdminPanel title="Карточка пользователя"><div className="flex min-h-48 items-center justify-center" aria-live="polite"><Loader2 className="animate-spin" /></div></AdminPanel>;
  if (query.isError || !query.data) return <AdminPanel title="Карточка пользователя"><div className="flex items-center gap-3 px-6 py-12 text-sm text-red-700"><AlertCircle size={18} />Не удалось загрузить карточку.</div></AdminPanel>;
  const user = query.data;
  return <AdminPanel title="Карточка пользователя" subtitle="Действия выполняются сервером через Better Auth Admin plugin." aside={<span className="font-mono text-[11px] text-neutral-500">{user.id}</span>}>
    <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)]">
      <div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Email</p><p className="mt-1 break-all text-sm font-semibold">{user.email}</p></div><div><p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Статус</p><p className="mt-1 text-sm">{user.email_verified ? 'Email подтверждён' : 'Email не подтверждён'}</p></div><div><p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Роль</p><p className="mt-1 text-sm font-semibold">{roleLabel(user.role)}</p></div><div><p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Блокировка</p><p className={`mt-1 text-sm font-semibold ${user.banned ? 'text-red-700' : 'text-emerald-700'}`}>{user.banned ? 'Заблокирован' : 'Активен'}</p>{user.ban_reason && <p className="mt-1 break-words text-xs text-neutral-500">{user.ban_reason}</p>}</div></div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1"><button type="button" onClick={() => onAction({ kind: 'role', user })} className="inline-flex min-h-11 items-center justify-center gap-2 border border-black/10 bg-white px-3 text-sm font-semibold hover:bg-neutral-100"><Shield size={15} />Сменить роль</button><button type="button" onClick={() => onAction({ kind: user.banned ? 'unban' : 'ban', user })} className="inline-flex min-h-11 items-center justify-center gap-2 border border-black/10 bg-white px-3 text-sm font-semibold hover:bg-neutral-100">{user.banned ? <ShieldOff size={15} /> : <Ban size={15} />}{user.banned ? 'Снять бан' : 'Заблокировать'}</button><button type="button" onClick={() => { if (window.confirm('Отозвать все активные сессии пользователя?')) revoke.mutate(`/admin/control/users/${user.id}/sessions/revoke-all`); }} disabled={revoke.isPending || user.sessions.length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-800 disabled:opacity-50"><KeyRound size={15} />Отозвать все сессии</button></div>
      <div className="lg:col-span-2"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Активные сессии ({user.sessions.length})</h3>{user.sessions.length === 0 && <span className="text-xs text-neutral-500">Нет активных сессий</span>}</div><div className="mt-3 grid gap-2">{user.sessions.map((session) => <div key={session.id} className="flex flex-col gap-3 border border-black/10 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-all font-mono text-xs text-neutral-700">{session.id}</p><p className="mt-1 text-xs text-neutral-500">{session.user_agent || 'User-Agent не указан'} · до {formatDate(session.expires_at)}</p></div><button type="button" onClick={() => { if (window.confirm('Отозвать эту сессию?')) revoke.mutate(`/admin/control/users/${user.id}/sessions/${session.id}/revoke`); }} className="min-h-10 shrink-0 border border-black/10 px-3 text-xs font-semibold hover:bg-neutral-100">Отозвать</button></div>)}</div></div>
    </div>
  </AdminPanel>;
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActionDraft | null>(null);
  const query = useQuery({ queryKey: ['admin-control-users', search, page], queryFn: () => api.get(`/admin/control/users?page=${page}&per_page=20${search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ''}`) as Promise<UsersResponse>, retry: 1 });
  const audit = useQuery({ queryKey: ['admin-control-audit'], queryFn: () => api.get('/admin/control/audit?per_page=8') as Promise<AuditResponse>, retry: 1 });
  const items = query.data?.items ?? [];
  return <>
    <AdminPageHeader eyebrow="Admin / Users" title="Пользователи" description="Закрытый операционный контур: доступ, сессии, блокировки и роли. Данные не покидают PeakTalk." index="02" />
    <div className="mt-6 grid gap-6">
      <AdminPanel title="Поиск и список" subtitle="Поиск выполняется по email через Better Auth Admin plugin.">
        <div className="border-b border-black/8 p-5 sm:p-6"><label htmlFor="admin-user-search" className="sr-only">Поиск по email</label><div className="flex items-center gap-3 border border-black/10 bg-white px-3"><Search size={17} className="text-neutral-500" /><input id="admin-user-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Поиск по email" className="min-h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" /></div></div>
        {query.isLoading ? <div className="flex min-h-56 items-center justify-center" aria-live="polite"><Loader2 className="animate-spin" /></div> : query.isError ? <div className="flex min-h-56 items-center justify-center gap-3 px-6 text-sm text-red-700"><AlertCircle size={18} />Не удалось загрузить список. Повторите запрос.</div> : items.length === 0 ? <AdminEmptyState icon={UserRound} title="Пользователи не найдены" description={search ? 'Измените поисковый запрос.' : 'В системе пока нет пользователей.'} /> : <><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-neutral-950 text-xs uppercase tracking-[0.14em] text-white"><tr><th scope="col" className="px-5 py-3 font-medium">Пользователь</th><th scope="col" className="px-5 py-3 font-medium">Email</th><th scope="col" className="px-5 py-3 font-medium">Роль</th><th scope="col" className="px-5 py-3 font-medium">Статус</th><th scope="col" className="px-5 py-3 font-medium">Создан</th><th scope="col" className="px-5 py-3"><span className="sr-only">Открыть</span></th></tr></thead><tbody>{items.map((user) => <tr key={user.id} className="border-b border-black/8 align-top last:border-0"><td className="px-5 py-4"><button type="button" onClick={() => setSelectedId(user.id)} className="text-left text-sm font-semibold underline decoration-black/20 underline-offset-4 hover:decoration-black">{user.name || 'Без имени'}</button></td><td className="max-w-[260px] break-all px-5 py-4 text-sm text-neutral-700">{user.email}</td><td className="px-5 py-4 text-sm">{roleLabel(user.role)}</td><td className="px-5 py-4 text-sm"><span className={user.banned ? 'text-red-700' : 'text-emerald-700'}>{user.banned ? 'Бан' : 'Активен'}</span></td><td className="whitespace-nowrap px-5 py-4 text-xs text-neutral-500">{formatDate(user.created_at)}</td><td className="px-5 py-4"><button type="button" onClick={() => setSelectedId(user.id)} aria-label={`Открыть ${user.email}`} className="inline-flex h-9 w-9 items-center justify-center border border-black/10 bg-white"><Eye size={15} /></button></td></tr>)}</tbody></table></div><AdminPagination page={query.data?.page ?? page} pages={query.data?.pages ?? 1} total={query.data?.total ?? 0} onPageChange={setPage} /></>}
      </AdminPanel>
      {selectedId && <UserDetailCard userId={selectedId} onAction={setDraft} />}
      <AdminPanel title="Audit log" subtitle="Последние административные события; metadata ограничена allowlist и не содержит токенов или секретов.">
        {audit.isLoading ? <div className="flex min-h-32 items-center justify-center"><Loader2 className="animate-spin" /></div> : audit.isError ? <div className="flex items-center gap-3 px-6 py-10 text-sm text-red-700"><AlertCircle size={18} />Audit log недоступен.</div> : audit.data?.items.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-neutral-100 text-xs uppercase tracking-[0.14em] text-neutral-600"><tr><th className="px-5 py-3">Время</th><th className="px-5 py-3">Действие</th><th className="px-5 py-3">Target</th><th className="px-5 py-3">Результат</th></tr></thead><tbody>{audit.data.items.map((item, index) => <tr key={`${item.timestamp}-${index}`} className="border-b border-black/8 last:border-0"><td className="whitespace-nowrap px-5 py-3 text-xs text-neutral-500">{formatDate(item.timestamp)}</td><td className="px-5 py-3 font-semibold">{item.action}</td><td className="max-w-[220px] break-all px-5 py-3 font-mono text-xs text-neutral-600">{item.target || '—'}</td><td className={`px-5 py-3 text-xs font-semibold uppercase ${item.outcome === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{item.outcome}</td></tr>)}</tbody></table></div> : <AdminEmptyState icon={Clock3} title="Событий пока нет" description="Административные действия появятся здесь." />}
      </AdminPanel>
    </div>
    {draft && <ActionDialog draft={draft} onClose={() => setDraft(null)} onDone={() => { void query.refetch(); void audit.refetch(); if (selectedId) void queryClient.invalidateQueries({ queryKey: ['admin-control-user', selectedId] }); }} />}
  </>;
}
