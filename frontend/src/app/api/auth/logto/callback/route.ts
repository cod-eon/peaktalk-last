import { handleSignIn } from '@logto/next/server-actions';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { appBaseUrl, isLogtoConfigured, logtoConfig, safeReturnPath } from '@/lib/logto';

export async function GET(request: NextRequest) {
  if (!isLogtoConfigured) {
    return NextResponse.json({ detail: 'Logto application is not configured.' }, { status: 503 });
  }

  await handleSignIn(logtoConfig, request.nextUrl);
  const cookieStore = await cookies();
  const returnPath = safeReturnPath(cookieStore.get('peaktalk_auth_return')?.value);
  cookieStore.delete('peaktalk_auth_return');
  return NextResponse.redirect(new URL(returnPath, appBaseUrl));
}
