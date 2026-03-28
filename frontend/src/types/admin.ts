import type { PlanId, PaymentStatus } from './billing';

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export interface AdminStats {
  users_total: number;
  users_pro: number;
  users_starter: number;
  simulations_total: number;
  simulations_today: number;
  payments_total_rub: number;
  payments_this_month_rub: number;
  payments_count_total: number;
  active_subs_count: number;
}

// ─── Admin Users ──────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  plan: PlanId;
  subscription_status: string;
  period_end: string | null;
  simulations_used: number;
  documents_uploaded: number;
  created_at: string;
  is_active: boolean;
}

export interface AdminUserDetail extends AdminUser {
  full_name: string | null;
  last_login: string | null;
  total_simulations: number;
  total_documents: number;
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
  plan: PlanId;
  period_days: number;
}

export interface SetPlanResponse {
  success: boolean;
  message: string;
}

// ─── Admin Payments ───────────────────────────────────────────────────────────

export interface AdminPayment {
  id: string;
  created_at: string;
  user_email: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  yookassa_id: string | null;
  plan: PlanId | null;
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
  plan: PlanId;
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
