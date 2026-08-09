import { getAccessToken } from '@logto/next/server-actions';
import { NextResponse } from 'next/server';

import { isLogtoConfigured, logtoApiResource, logtoConfig } from '@/lib/logto';

export async function GET() {
  if (!isLogtoConfigured) {
    return NextResponse.json({ detail: 'Logto application is not configured.' }, { status: 503 });
  }

  try {
    const accessToken = await getAccessToken(logtoConfig, logtoApiResource);
    return NextResponse.json({ access_token: accessToken }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ detail: 'Authentication required.' }, { status: 401 });
  }
}
