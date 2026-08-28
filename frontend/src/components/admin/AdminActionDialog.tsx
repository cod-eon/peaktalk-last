'use client';

import { useEffect, useId, useState } from 'react';
import { AlertCircle, Ban, Check, KeyRound, Loader2, Shield, ShieldOff, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { ControlUser } from '@/lib/admin-control';

export type AdminActionKind = 'role' | 'ban' | 'unban' | 'revoke' | 'revoke-all';
export type AdminActionDraft = { kind: AdminActionKind; user: ControlUser; sessionId?: string };

const actionTitle: Record<AdminActionKind, string> = {
  role: 'Сменить роль',
  ban: 'Заблокировать пользователя',
  unban: 'Снять блокировку',
  revoke: 'Отозвать сессию',
  'revoke-all': 'Отозвать все сессии',
};

function adminErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return 'Не удалось выполнить действие. Попробуйте ещё раз.';
  if (error instanceof ApiError) {
    if (error.code === 'confirmation_required') return 'Подтвердите действие и заполните причину.';
    if (error.code === 'self_demotion_forbidden') return 'Нельзя снять собственную роль администратора.';
    if (error.status === 401) return 'Сессия истекла. Войдите снова.';
    if (error.status === 403) return 'Недостаточно прав для этого действия.';
    if (error.status >= 500) return 'Сервис авторизации временно недоступен.';
  }
  return error.message || 'Не удалось выполнить действие. Попробуйте ещё раз.';
}

export function AdminActionDialog({
  draft,
  onClose,
  onDone,
}: {
  draft: AdminActionDraft;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const [role, setRole] = useState(draft.user.role === 'admin' ? 'user' : 'admin');
  const titleId = useId();
  const needsReason = draft.kind === 'ban' || draft.kind === 'unban';
  const mutation = useMutation({
    mutationFn: async () => {
      if (draft.kind === 'role') return api.post(`/admin/control/users/${encodeURIComponent(draft.user.id)}/role`, { role, confirm: true });
      if (draft.kind === 'ban' || draft.kind === 'unban') return api.post(`/admin/control/users/${encodeURIComponent(draft.user.id)}/${draft.kind}`, { reason: reason.trim(), confirm: true });
      if (draft.kind === 'revoke-all') return api.post(`/admin/control/users/${encodeURIComponent(draft.user.id)}/sessions/revoke-all`);
      return api.post(`/admin/control/users/${encodeURIComponent(draft.user.id)}/sessions/${encodeURIComponent(draft.sessionId ?? '')}/revoke`);
    },
    onSuccess: () => {
      toast.success('Изменение применено.');
      onDone();
      onClose();
    },
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !mutation.isPending) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mutation.isPending, onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral-950/40 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-md border border-black/10 bg-[var(--landing-paper)] p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-neutral-500">Подтверждение действия</p>
            <h2 id={titleId} className="mt-1 text-xl font-semibold tracking-[-0.02em]">{actionTitle[draft.kind]}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={mutation.isPending} aria-label="Закрыть диалог" className="inline-flex h-9 w-9 items-center justify-center border border-black/10 bg-white disabled:opacity-50"><X size={16} aria-hidden="true" /></button>
        </div>
        <p className="mt-4 break-all text-sm text-neutral-700">{draft.user.email}</p>
        {draft.kind === 'role' ? <label htmlFor="admin-new-role" className="mt-5 block text-sm font-medium">Новая роль<select id="admin-new-role" value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 min-h-11 w-full border border-black/15 bg-white px-3 outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]"><option value="user">user</option><option value="admin">admin</option></select></label> : null}
        {needsReason ? <label htmlFor="admin-action-reason" className="mt-5 block text-sm font-medium">Причина<textarea id="admin-action-reason" autoFocus value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} className="mt-2 min-h-24 w-full resize-y border border-black/15 bg-white p-3 font-normal outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]" placeholder="Кратко опишите основание" /><span className="mt-1 block text-xs font-normal text-neutral-500">Причина сохраняется без текста сессии или других секретов.</span></label> : null}
        {mutation.error ? <p className="mt-4 flex gap-2 text-sm text-red-700" role="alert"><AlertCircle size={16} aria-hidden="true" />{adminErrorMessage(mutation.error)}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={mutation.isPending} className="min-h-10 border border-black/10 bg-white px-4 text-sm font-medium disabled:opacity-50">Отмена</button><button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending || (needsReason && !reason.trim())} className="inline-flex min-h-10 items-center justify-center gap-2 border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{mutation.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}Подтвердить</button></div>
      </section>
    </div>
  );
}

export function ActionIcon({ kind }: { kind: AdminActionKind }) {
  if (kind === 'role') return <Shield size={15} aria-hidden="true" />;
  if (kind === 'ban') return <Ban size={15} aria-hidden="true" />;
  if (kind === 'unban') return <ShieldOff size={15} aria-hidden="true" />;
  return <KeyRound size={15} aria-hidden="true" />;
}
