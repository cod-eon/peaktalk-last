import type { PaymentStatus } from './billing';

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export type AdminPlanId = 'free' | 'per_session' | 'personal' | 'pro' | 'team' | 'starter';

export interface AdminStats {
  total_users: number;
  paying_users: number;
  free_users: number;
  total_simulations: number;
  simulations_today: number;
  revenue_total_rub: number;
  revenue_this_month_rub: number;
  successful_payments_count: number;
}

// ─── Admin Charts ─────────────────────────────────────────────────────────────

export interface DayPoint {
  date: string; // "YYYY-MM-DD"
  value: number;
}

export interface AdminChartsData {
  revenue_by_day: DayPoint[];
  simulations_by_day: DayPoint[];
  users_by_day: DayPoint[];
}

// ─── Admin Users ──────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  plan: AdminPlanId;
  subscription_status: string;
  period_end: string | null;
  simulations_used: number;
  documents_uploaded: number;
  simulations_total: number;
  created_at: string;
}

export interface AdminUserDetail extends AdminUser {
  period_start: string | null;
  subscription_created_at: string | null;
  cancelled_at: string | null;
  payments_count: number;
  payments_total_rub: number;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// ─── Set Plan ─────────────────────────────────────────────────────────────────

export interface SetPlanPayload {
  plan: AdminPlanId;
  period_days: number;
}

export interface SetPlanResponse {
  user_id: string;
  plan: AdminPlanId;
  status: string;
  period_start: string;
  period_end: string | null;
}

// ─── Admin Payments ───────────────────────────────────────────────────────────

export interface AdminPayment {
  id: string;
  created_at: string;
  user_email: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string | null;
  yookassa_payment_id: string;
}

export interface AdminPaymentsResponse {
  items: AdminPayment[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// ─── Admin Subscriptions ──────────────────────────────────────────────────────

export interface AdminSubscription {
  id: string;
  user_email: string;
  plan: AdminPlanId;
  status: string;
  period_start: string;
  period_end: string | null;
  created_at: string;
}

export interface AdminSubscriptionsResponse {
  items: AdminSubscription[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface MaintenanceStatus {
  enabled: boolean;
  updated_at?: string | null;
}
