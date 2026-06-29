const RETURN_PATH_ORIGIN = 'https://peaktalk.local';

const DEFAULT_ALLOWED_RETURN_PREFIXES = [
  '/dashboard',
  '/upload',
  '/simulation',
  '/billing',
  '/onboarding',
  '/documents',
  '/meetings',
  '/personas',
  '/settings',
  '/analysis',
  '/scenarios',
] as const;

function isAllowedPathname(pathname: string, allowedPrefixes: readonly string[]): boolean {
  return allowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function normalizeOptionalInternalReturnPath(
  value: string | null | undefined,
  allowedPrefixes: readonly string[] = DEFAULT_ALLOWED_RETURN_PREFIXES,
): string | null {
  const raw = value?.trim();
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) {
    return null;
  }

  try {
    const url = new URL(raw, RETURN_PATH_ORIGIN);
    if (url.origin !== RETURN_PATH_ORIGIN || !isAllowedPathname(url.pathname, allowedPrefixes)) {
      return null;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function normalizeInternalReturnPath(
  value: string | null | undefined,
  fallback = '/dashboard',
  allowedPrefixes: readonly string[] = DEFAULT_ALLOWED_RETURN_PREFIXES,
): string {
  return normalizeOptionalInternalReturnPath(value, allowedPrefixes) ?? fallback;
}

export function buildBillingSuccessPath(returnPath: string | null | undefined): string {
  const normalizedReturnPath = normalizeOptionalInternalReturnPath(returnPath);
  return normalizedReturnPath
    ? `/billing/success?return=${encodeURIComponent(normalizedReturnPath)}`
    : '/billing/success';
}

export function isGuestPaywallReturnPath(returnPath: string | null | undefined): boolean {
  return normalizeOptionalInternalReturnPath(returnPath) === '/simulation/from-guest';
}
