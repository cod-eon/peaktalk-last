import { signIn } from '@logto/next/server-actions';
import { Prompt } from '@logto/js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { appBaseUrl, isLogtoConfigured, logtoConfig, safeReturnPath } from '@/lib/logto';

export async function GET(request: NextRequest) {
  if (!isLogtoConfigured) {
    return NextResponse.json({ detail: 'Logto application is not configured.' }, { status: 503 });
  }

  const returnPath = safeReturnPath(request.nextUrl.searchParams.get('return'));
  const forceLogin = request.nextUrl.searchParams.get('force') === '1';
  const firstScreen = request.nextUrl.searchParams.get('screen') === 'reset_password'
    ? ('reset_password' as const)
    : undefined;
  const cookieStore = await cookies();
  cookieStore.set('peaktalk_auth_return', returnPath, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 600,
    path: '/',
  });

  await signIn(logtoConfig, {
    redirectUri: new URL('/api/auth/logto/callback', appBaseUrl),
    interactionMode: 'signIn',
    clearTokens: true,
    ...(firstScreen ? { firstScreen } : {}),
    ...(forceLogin ? { prompt: Prompt.Login } : {}),
    extraParams: { ui_locales: 'ru' },
  });
}
