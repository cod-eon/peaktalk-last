import { getLogtoContext } from '@logto/next/server-actions';
import { NextResponse } from 'next/server';

import { isLogtoConfigured, logtoConfig } from '@/lib/logto';

export async function GET() {
  if (!isLogtoConfigured) {
    return NextResponse.json({ isAuthenticated: false, configured: false });
  }

  const { isAuthenticated, claims, userInfo } = await getLogtoContext(logtoConfig, { fetchUserInfo: true });
  const profile = userInfo ?? claims;
  return NextResponse.json({
    isAuthenticated,
    configured: true,
    user: isAuthenticated && profile
      ? {
          sub: profile.sub,
          email: profile.email,
          email_verified: profile.email_verified,
          name: profile.name,
          picture: profile.picture,
        }
      : null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
