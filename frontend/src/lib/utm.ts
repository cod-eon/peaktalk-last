/**
 * First-touch UTM tracking.
 *
 * On first visit with UTM params → save to localStorage.
 * On first visit without UTM → save { utm_source: 'direct' }.
 * Never overwrites existing data (first-touch attribution).
 */

const STORAGE_KEY = 'peaktalk_utm';

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export type UtmData = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

export function captureUTM(): void {
  if (typeof window === 'undefined') return;

  // Already captured — first-touch, never overwrite
  if (localStorage.getItem(STORAGE_KEY)) return;

  const params = new URLSearchParams(window.location.search);
  const hasUtm = UTM_KEYS.some((k) => params.has(k));

  const data: UtmData = hasUtm
    ? {
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        utm_content: params.get('utm_content'),
        utm_term: params.get('utm_term'),
      }
    : {
        utm_source: 'direct',
        utm_medium: null,
        utm_campaign: null,
        utm_content: null,
        utm_term: null,
      };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getUTM(): UtmData {
  if (typeof window === 'undefined') {
    return { utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, utm_term: null };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, utm_term: null };
  }

  try {
    return JSON.parse(raw) as UtmData;
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, utm_term: null };
  }
}

export function clearUTM(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
