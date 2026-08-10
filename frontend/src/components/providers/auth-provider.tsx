"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, type AuthStatus } from '@/store/authStore';
import { captureUTM } from '@/lib/utm';
import { normalizeOptionalInternalReturnPath } from '@/lib/return-path';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setAuthState, setIsLoading } = useAuthStore();
  const user = useAuthStore((state) => state.user);
  const authState = useAuthStore((state) => state.authState);
  const isLoading = useAuthStore((state) => state.isLoading);
  const pathname = usePathname();
  const router = useRouter();
  const [sessionCheckPath, setSessionCheckPath] = useState<string | null>(null);

  const protectedPaths = ['/dashboard', '/documents', '/upload', '/simulation', '/analytics', '/settings', '/analysis', '/onboarding', '/billing', '/admin'];
  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    captureUTM();

    let cancelled = false;
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password');
    const isVerificationPage = pathname.startsWith('/verify-email');

    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('session lookup failed');
        return response.json() as Promise<{
          isAuthenticated: boolean;
          auth_state?: 'signed_out' | 'email_verification_required' | 'ready';
          user?: { sub: string; email?: string | null; email_verified?: boolean; name?: string } | null;
        }>;
      })
      .then((session) => {
        if (cancelled) return;
        const nextAuthState: AuthStatus = session.auth_state ?? (session.isAuthenticated ? 'ready' : 'signed_out');
        const user = session.isAuthenticated && session.user?.sub
          ? {
              id: session.user.sub,
              email: session.user.email ?? null,
              email_verified: session.user.email_verified === true,
              user_metadata: { display_name: session.user.name },
            }
          : null;
        setUser(user);
        setSession(user ? {} : null);
        setAuthState(nextAuthState);
        setIsLoading(false);
        setSessionCheckPath(pathname);
        if (!user && isProtected) {
          router.replace(`/login?return=${encodeURIComponent(`${pathname}${window.location.search}`)}`);
        } else if (!user && isVerificationPage) {
          router.replace('/login?return=%2Fverify-email');
        } else if (user && nextAuthState === 'email_verification_required' && !isVerificationPage) {
          const returnPath = normalizeOptionalInternalReturnPath(`${pathname}${window.location.search}`) ?? '/onboarding';
          router.replace(`/verify-email?return=${encodeURIComponent(returnPath)}`);
        } else if (user && nextAuthState === 'ready' && isAuthPage) {
          const returnPath = normalizeOptionalInternalReturnPath(new URLSearchParams(window.location.search).get('return'));
          router.replace(returnPath ?? '/dashboard');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setSession(null);
        setAuthState('signed_out');
        setIsLoading(false);
        setSessionCheckPath(pathname);
        if (isProtected) router.replace('/login');
      });

    return () => {
      cancelled = true;
    };
  }, [isProtected, pathname, router, setSession, setUser, setAuthState, setIsLoading]);

  // Do not mount protected pages until the cookie session is resolved. This
  // prevents onboarding from racing the session check and calling the API
  // without a usable bearer token.
  if (isProtected && (
    sessionCheckPath !== pathname ||
    isLoading ||
    !user ||
    (authState === 'email_verification_required' && !pathname.startsWith('/verify-email'))
  )) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" aria-live="polite">
        <span className="text-sm text-neutral-500">Проверяем сессию…</span>
      </div>
    );
  }

  return <>{children}</>;
}
