import { getLogtoContext } from '@logto/next/server-actions';
import { NextResponse } from 'next/server';

import { isLogtoConfigured, logtoConfig } from '@/lib/logto';

export async function GET() {
  if (!isLogtoConfigured) {
    return NextResponse.json({ isAuthenticated: false, configured: false });
  }

  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);
  return NextResponse.json({
    isAuthenticated,
    configured: true,
    user: isAuthenticated && claims
      ? {
          sub: claims.sub,
          email: claims.email,
          email_verified: claims.email_verified,
          name: claims.name,
          picture: claims.picture,
        }
      : null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
