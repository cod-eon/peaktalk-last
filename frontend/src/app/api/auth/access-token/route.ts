import { createHmac } from 'node:crypto';
import { getAccessToken } from '@logto/next/server-actions';
import { getLogtoContext } from '@logto/next/server-actions';
import { NextResponse } from 'next/server';

import { isLogtoConfigured, logtoApiResource, logtoConfig } from '@/lib/logto';

const IDENTITY_ASSERTION_AUDIENCE = 'peaktalk-api';
const IDENTITY_ASSERTION_TTL_SECONDS = 300;

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function createIdentityAssertion(profile: {
  sub?: unknown;
  email?: unknown;
  email_verified?: unknown;
}): string | null {
  const secret = process.env.LOGTO_IDENTITY_ASSERTION_SECRET || process.env.LOGTO_COOKIE_SECRET;
  if (
    !secret ||
    typeof profile.sub !== 'string' ||
    !profile.sub ||
    typeof profile.email !== 'string' ||
    !profile.email.trim() ||
    profile.email_verified !== true
  ) {
    return null;
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = encodeBase64Url(JSON.stringify({
    aud: IDENTITY_ASSERTION_AUDIENCE,
    sub: profile.sub,
    email: profile.email.trim().toLowerCase(),
    email_verified: true,
    iat: issuedAt,
    exp: issuedAt + IDENTITY_ASSERTION_TTL_SECONDS,
  }));
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export async function GET() {
  if (!isLogtoConfigured) {
    return NextResponse.json({ detail: 'Logto application is not configured.' }, { status: 503 });
  }

  try {
    const context = await getLogtoContext(logtoConfig, { fetchUserInfo: true });
    if (!context.isAuthenticated) {
      return NextResponse.json({ detail: 'Authentication required.' }, { status: 401 });
    }

    const profile = context.userInfo ?? context.claims;
    if (
      !profile ||
      typeof profile.email !== 'string' ||
      !profile.email.trim() ||
      profile.email_verified !== true
    ) {
      return NextResponse.json(
        {
          code: 'email_verification_required',
          detail: 'Подтвердите email, чтобы продолжить работу в PeakTalk.',
        },
        { status: 403, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const accessToken = await getAccessToken(logtoConfig, logtoApiResource);
    return NextResponse.json(
      {
        access_token: accessToken,
        identity_assertion: createIdentityAssertion(profile),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ detail: 'Authentication required.' }, { status: 401 });
  }
}
