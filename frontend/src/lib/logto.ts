import type { LogtoNextConfig } from '@logto/next';

const appId = process.env.LOGTO_APP_ID || 'logto-app-not-configured';
const appSecret = process.env.LOGTO_APP_SECRET || 'logto-app-secret-not-configured';
const cookieSecret = process.env.LOGTO_COOKIE_SECRET || 'logto-cookie-secret-not-configured-32-chars';

export const logtoBaseUrl = process.env.LOGTO_ENDPOINT || 'https://auth.peaktalk.ru';
export const logtoApiResource = process.env.LOGTO_API_RESOURCE || 'https://peaktalk.ru/api';
export const appBaseUrl = process.env.APP_BASE_URL || 'https://peaktalk.ru';

export const logtoConfig: LogtoNextConfig = {
  appId,
  appSecret,
  endpoint: logtoBaseUrl,
  baseUrl: appBaseUrl,
  cookieSecret,
  cookieSecure: process.env.NODE_ENV === 'production',
  resources: [logtoApiResource],
  scopes: ['email'],
};

export const isLogtoConfigured =
  appId !== 'logto-app-not-configured' &&
  appSecret !== 'logto-app-secret-not-configured' &&
  cookieSecret.length >= 32;

export function safeReturnPath(value: string | null | undefined, fallback = '/dashboard') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}
