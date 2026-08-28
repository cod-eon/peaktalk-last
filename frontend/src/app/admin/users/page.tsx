'use client';

import Link from 'next/link';
import { Search, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatAdminDate, roleLabel, type UsersResponse } from '@/lib/admin-control';
import { AdminEmptyState, AdminErrorState, AdminPageHeader, AdminPagination, AdminPanel } from '@/components/admin/AdminPrimitives';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'email'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const query = useQuery({
    queryKey: ['admin-control-users', search, page, sortBy, sortDirection],
    queryFn: () => api.get(`/admin/control/users?page=${page}&per_page=20&sort_by=${sortBy}&sort_direction=${sortDirection}${search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ''}`) as Promise<UsersResponse>,
    retry: 1,
  });
  const items = query.data?.items ?? [];

  return (
    <>
      <AdminPageHeader eyebrow="Пользователи" title="Пользователи" description="Поиск пользователей и переход к их доступу, сессиям и истории действий." index="02" />
      <div className="mt-6">
        <AdminPanel title="Список пользователей" subtitle={query.data ? `${query.data.total.toLocaleString('ru-RU')} записей. Страница ${query.data.page} из ${query.data.pages}.` : 'Список загружается из Better Auth.'}>
          <div className="grid gap-3 border-b border-black/8 p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end sm:p-5">
            <label htmlFor="admin-user-search" className="min-w-0 text-sm font-medium">Поиск по email или имени
              <span className="relative mt-2 block"><Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input id="admin-user-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="user@example.com" className="min-h-11 w-full border border-black/15 bg-white px-3 pl-9 text-sm outline-none placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]" /></span>
            </label>
            <label htmlFor="admin-user-sort" className="text-sm font-medium">Сортировка
              <select id="admin-user-sort" value={`${sortBy}:${sortDirection}`} onChange={(event) => { const [nextBy, nextDirection] = event.target.value.split(':') as ['createdAt' | 'updatedAt' | 'email', 'asc' | 'desc']; setSortBy(nextBy); setSortDirection(nextDirection); setPage(1); }} className="mt-2 min-h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]"><option value="createdAt:desc">Сначала новые</option><option value="createdAt:asc">Сначала старые</option><option value="updatedAt:desc">Недавно изменённые</option><option value="email:asc">Email по алфавиту</option></select>
            </label>
          </div>

          {query.isLoading ? <div className="grid gap-2 p-4 sm:p-5" aria-live="polite">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-16 animate-pulse border border-black/10 bg-neutral-50" />)}</div> : query.isError ? <AdminErrorState message="Не удалось загрузить список пользователей." onRetry={() => void query.refetch()} /> : items.length === 0 ? <AdminEmptyState icon={UserRound} title="Пользователи не найдены" description={search ? 'Измените запрос и повторите поиск.' : 'В Better Auth пока нет пользователей.'} /> : <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full table-fixed text-left text-sm">
                <caption className="sr-only">Список пользователей PeakTalk</caption>
                <thead className="border-b border-black/10 bg-neutral-50 text-xs text-neutral-500"><tr><th scope="col" className="w-[22%] px-5 py-3 font-medium">Имя</th><th scope="col" className="w-[28%] px-5 py-3 font-medium">Email</th><th scope="col" className="w-[14%] px-5 py-3 font-medium">Роль</th><th scope="col" className="w-[14%] px-5 py-3 font-medium">Статус</th><th scope="col" className="w-[10%] px-5 py-3 font-medium">Сессии</th><th scope="col" className="w-[12%] px-5 py-3 font-medium">Активность</th></tr></thead>
                <tbody>{items.map((user) => <tr key={user.id} className="border-b border-black/8 align-top last:border-0"><td className="px-5 py-4"><Link href={`/admin/users/${encodeURIComponent(user.id)}`} className="break-words font-medium underline decoration-black/20 underline-offset-4 hover:decoration-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]">{user.name || 'Без имени'}</Link></td><td className="break-all px-5 py-4 text-neutral-700">{user.email}</td><td className="break-words px-5 py-4">{roleLabel(user.role)}</td><td className={`break-words px-5 py-4 ${user.banned ? 'text-red-700' : 'text-emerald-700'}`}>{user.banned ? 'Заблокирован' : 'Активен'}</td><td className="px-5 py-4">{user.active_sessions}</td><td className="break-words px-5 py-4 text-xs text-neutral-500">{formatAdminDate(user.last_activity)}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="grid gap-2 p-4 md:hidden"><p className="mb-1 text-xs text-neutral-500">{query.data?.total.toLocaleString('ru-RU')} записей</p>{items.map((user) => <Link key={user.id} href={`/admin/users/${encodeURIComponent(user.id)}`} className="border border-black/10 bg-white p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"><span className="block break-words text-sm font-semibold">{user.name || 'Без имени'}</span><span className="mt-1 block break-all text-sm text-neutral-600">{user.email}</span><span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500"><span>Роль: {roleLabel(user.role)}</span><span className={user.banned ? 'text-red-700' : 'text-emerald-700'}>{user.banned ? 'Заблокирован' : 'Активен'}</span><span>Сессий: {user.active_sessions}</span></span></Link>)}</div>
            <AdminPagination page={query.data?.page ?? page} pages={query.data?.pages ?? 1} total={query.data?.total ?? 0} onPageChange={setPage} />
          </>}
        </AdminPanel>
      </div>
    </>
  );
}
