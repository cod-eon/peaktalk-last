export type PlanId = 'free' | 'per_session';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing' | 'incomplete';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';

export type UpgradeReason = 'simulations' | 'documents' | 'personas' | 'pdf';

export interface PlanInfo {
  id: PlanId;
  name: string;
  price_monthly: number;
  currency: string;
  features: string[];
  limits: {
    simulations_per_month: number | null;
    documents_total: number | null;
    pdf_reports: boolean;
    personas_allowed: string[] | null;
  };
}

export interface BillingSubscription {
  plan: PlanId;
  status: SubscriptionStatus | string;
  period_end: string | null;
}

export interface BillingUsage {
  simulations_used: number;
  documents_uploaded: number;
  period_start: string;
}

export interface BillingLimits {
  simulations_per_month: number | null;
  documents_total: number | null;
  pdf_reports: boolean;
  personas_allowed: string[] | null;
}

export interface BillingStatus {
  subscription: BillingSubscription;
  usage: BillingUsage;
  limits: BillingLimits;
  can_start_simulation: boolean;
  can_upload_document: boolean;
  payments_enabled: boolean;
  session_credits?: number;
}

export interface PaymentMethodSummary {
  is_bound: boolean;
  type: string | null;
  display_label: string | null;
  auto_renew_enabled: boolean;
}

export interface PaymentInitResponse {
  payment_url: string;
  payment_id: string;
}

export interface Payment {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  description: string;
  status: PaymentStatus;
}

export interface ApiError402 {
  detail: string;
  code: 'simulation_limit_exceeded' | 'document_limit_exceeded' | 'persona_not_allowed';
}
