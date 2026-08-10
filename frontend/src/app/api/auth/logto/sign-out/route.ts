import { signOut } from '@logto/next/server-actions';
import { NextResponse } from 'next/server';

import { appBaseUrl, isLogtoConfigured, logtoConfig, safeReturnPath } from '@/lib/logto';

export async function GET(request: Request) {
  if (!isLogtoConfigured) {
    return NextResponse.redirect(new URL('/', appBaseUrl));
  }

  const returnPath = safeReturnPath(new URL(request.url).searchParams.get('return'), '/');
  await signOut(logtoConfig, new URL(returnPath, appBaseUrl).toString());
}
