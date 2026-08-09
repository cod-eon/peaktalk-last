import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const target = new URL('/api/auth/logto/callback', request.url);
  for (const [key, value] of new URL(request.url).searchParams) target.searchParams.set(key, value);
  return NextResponse.redirect(target);
}
