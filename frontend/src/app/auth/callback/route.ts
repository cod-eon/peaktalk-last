import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Reconstruct public origin from forwarded headers set by Nginx.
  // request.url contains the internal Docker hostname, not the public domain.
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'peaktalk.ru';
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  const origin = `${proto}://${host}`;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      // Check if user has completed onboarding
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      try {
        const meRes = await fetch(`${apiUrl}/me`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          if (!me?.onboarding_profile) {
            return NextResponse.redirect(`${origin}/onboarding`);
          }
        }
      } catch {
        // Backend unavailable — fall through to default redirect
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
