export type ControlUser = {
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
  active_sessions: number;
  last_activity: string | null;
};

export type AdminSession = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  expires_at: string | null;
  user_agent: string | null;
};

export type AuditItem = {
  actor: string;
  target: string | null;
  action: string;
  outcome: string;
  timestamp: string;
  metadata: Record<string, unknown>;
};

export type AuthStats = {
  total_users: number;
  new_users_24h: number;
  new_users_7d: number;
  new_users_30d: number;
  verified_users: number;
  unverified_users: number;
  active_sessions: number;
  banned_users: number;
  role_distribution: Record<string, number>;
};

export type UsersResponse = {
  items: ControlUser[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
};

export type UserDetail = ControlUser & {
  sessions: AdminSession[];
  audit: AuditItem[];
};

export type OverviewResponse = { stats: AuthStats; recent_events: AuditItem[] };
export type AuthResponse = {
  provider: string;
  status: string;
  stats: AuthStats;
  safe_config: Record<string, string | boolean>;
  recent_events: AuditItem[];
};

export function formatAdminDate(value: string | null) {
  if (!value) return 'Нет данных';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Нет данных';
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function roleLabel(role: string | null) {
  return role?.split(',').map((item) => item.trim()).filter(Boolean).join(', ') || 'user';
}

export function actionLabel(action: string) {
  return {
    role_change: 'Смена роли',
    ban: 'Блокировка',
    unban: 'Снятие блокировки',
    revoke_session: 'Отзыв сессии',
    revoke_all_sessions: 'Отзыв всех сессий',
    bootstrap_admin: 'Назначение администратора',
  }[action] ?? action;
}
