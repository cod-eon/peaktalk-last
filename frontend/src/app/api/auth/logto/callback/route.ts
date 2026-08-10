import { handleSignIn } from '@logto/next/server-actions';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { appBaseUrl, isLogtoConfigured, logtoConfig, safeReturnPath } from '@/lib/logto';

export async function GET(request: NextRequest) {
  if (!isLogtoConfigured) {
    return NextResponse.json({ detail: 'Logto application is not configured.' }, { status: 503 });
  }

  // Next.js receives this request from Nginx over the internal HTTP network.
  // Rebuild the callback URL from the public base URL so Logto's exact URI
  // verification remains stable behind the TLS-terminating reverse proxy.
  const callbackUrl = new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    appBaseUrl,
  );
  await handleSignIn(logtoConfig, callbackUrl);
  const cookieStore = await cookies();
  const returnPath = safeReturnPath(cookieStore.get('peaktalk_auth_return')?.value);
  cookieStore.delete('peaktalk_auth_return');
  return NextResponse.redirect(new URL(returnPath, appBaseUrl));
}
