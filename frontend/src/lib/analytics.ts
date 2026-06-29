import { captureUTM, getUTM } from './utm';

export const METRIKA_ID = 108419591;

export const ANALYTICS_EVENTS = {
  landingCtaClicked: 'landing_cta_clicked',
  scenarioCatalogViewed: 'scenario_catalog_viewed',
  scenarioCardClicked: 'scenario_card_clicked',
  scenarioPrimaryCtaClicked: 'scenario_primary_cta_clicked',
  scenarioDetailViewed: 'scenario_detail_viewed',
  scenarioStartClicked: 'scenario_start_clicked',
  guestPageViewed: 'guest_page_viewed',
  guestStarted: 'guest_started',
  guestQuestionSeen: 'guest_question_seen',
  guestAnswerSubmitted: 'guest_answer_submitted',
  guestPaywallSeen: 'guest_paywall_seen',
  guestPaywallCtaClicked: 'guest_paywall_cta_clicked',
  guestConversionCompleted: 'guest_conversion_completed',
  guestConversionFailed: 'guest_conversion_failed',
  billingOpened: 'billing_opened',
  paymentStarted: 'payment_started',
  paymentSucceeded: 'payment_succeeded',
  defenseRerunStarted: 'defense_rerun_started',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
export type AnalyticsValue = string | number | boolean | null | undefined;
export type AnalyticsProps = Record<string, AnalyticsValue>;

type MetrikaWindow = Window & {
  ym?: (id: number, method: 'reachGoal', goal: string, params?: Record<string, AnalyticsValue>) => void;
  dataLayer?: Array<Record<string, unknown>>;
};

export function trackEvent(event: AnalyticsEventName, props: AnalyticsProps = {}): void {
  if (typeof window === 'undefined') return;

  try {
    const analyticsWindow = window as MetrikaWindow;
    captureUTM();
    const utm = getUTM();
    const payload: Record<string, AnalyticsValue> = {
      ...utm,
      ...props,
    };

    analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
    analyticsWindow.dataLayer.push({ event, ...payload });
    analyticsWindow.ym?.(METRIKA_ID, 'reachGoal', event, payload);
  } catch {
    // Analytics must never break product flows.
  }
}
