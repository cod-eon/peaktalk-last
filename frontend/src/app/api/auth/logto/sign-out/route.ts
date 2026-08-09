import { signOut } from '@logto/next/server-actions';
import { NextResponse } from 'next/server';

import { appBaseUrl, isLogtoConfigured, logtoConfig } from '@/lib/logto';

export async function GET() {
  if (!isLogtoConfigured) {
    return NextResponse.redirect(new URL('/', appBaseUrl));
  }

  await signOut(logtoConfig, appBaseUrl);
}
