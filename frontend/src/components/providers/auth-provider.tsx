"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { captureUTM } from '@/lib/utm';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setIsLoading } = useAuthStore();
  const user = useAuthStore((state) => state.user);
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

    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('session lookup failed');
        return response.json() as Promise<{ isAuthenticated: boolean; user?: { sub: string; email?: string; name?: string } | null }>;
      })
      .then((session) => {
        if (cancelled) return;
        const user = session.isAuthenticated && session.user?.sub
          ? {
              id: session.user.sub,
              email: session.user.email ?? null,
              user_metadata: { display_name: session.user.name },
            }
          : null;
        setUser(user);
        setSession(user ? {} : null);
        setIsLoading(false);
        setSessionCheckPath(pathname);
        if (!user && isProtected) {
          router.replace(`/login?return=${encodeURIComponent(`${pathname}${window.location.search}`)}`);
        } else if (user && isAuthPage) {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setSession(null);
        setIsLoading(false);
        setSessionCheckPath(pathname);
        if (isProtected) router.replace('/login');
      });

    return () => {
      cancelled = true;
    };
  }, [isProtected, pathname, router, setSession, setUser, setIsLoading]);

  // Do not mount protected pages until the cookie session is resolved. This
  // prevents onboarding from racing the session check and calling the API
  // without a usable bearer token.
  if (isProtected && (sessionCheckPath !== pathname || isLoading || !user)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" aria-live="polite">
        <span className="text-sm text-neutral-500">Проверяем сессию…</span>
      </div>
    );
  }

  return <>{children}</>;
}
