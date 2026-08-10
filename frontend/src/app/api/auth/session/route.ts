import { getLogtoContext } from '@logto/next/server-actions';
import { NextResponse } from 'next/server';

import { isLogtoConfigured, logtoConfig } from '@/lib/logto';

export async function GET() {
  if (!isLogtoConfigured) {
    return NextResponse.json({
      isAuthenticated: false,
      configured: false,
      auth_state: 'signed_out',
      user: null,
    }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const { isAuthenticated, claims, userInfo } = await getLogtoContext(logtoConfig, { fetchUserInfo: true });
  const profile = userInfo ?? claims;
  const authenticated = Boolean(isAuthenticated && profile?.sub);
  const email = typeof profile?.email === 'string' ? profile.email : null;
  const emailVerified = profile?.email_verified === true;
  const authState: 'signed_out' | 'email_verification_required' | 'ready' = !authenticated
    ? 'signed_out'
    : email && emailVerified
      ? 'ready'
      : 'email_verification_required';

  return NextResponse.json({
    isAuthenticated,
    configured: true,
    auth_state: authState,
    user: authenticated && profile
      ? {
          sub: profile.sub,
          email,
          email_verified: emailVerified,
          name: profile.name,
          picture: profile.picture,
        }
      : null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
