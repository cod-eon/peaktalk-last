import { captureUTM, getUTM } from './utm';

const METRIKA_ID = 108419591;

type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsProps = Record<string, AnalyticsValue>;

type MetrikaWindow = Window & {
  ym?: (id: number, method: 'reachGoal', goal: string, params?: Record<string, AnalyticsValue>) => void;
};

export function trackEvent(event: string, props: AnalyticsProps = {}): void {
  if (typeof window === 'undefined') return;

  try {
    captureUTM();
    const utm = getUTM();
    const payload: Record<string, AnalyticsValue> = {
      ...utm,
      ...props,
    };

    (window as MetrikaWindow).ym?.(METRIKA_ID, 'reachGoal', event, payload);
  } catch {
    // Analytics must never break product flows.
  }
}
