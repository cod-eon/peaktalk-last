"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { captureUTM } from '@/lib/utm';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setIsLoading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    captureUTM();

    let cancelled = false;
    const protectedPaths = ['/dashboard', '/documents', '/upload', '/simulation', '/analytics', '/settings', '/analysis', '/onboarding', '/billing', '/admin'];
    const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
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
        if (isProtected) router.replace('/login');
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, router, setSession, setUser, setIsLoading]);

  return <>{children}</>;
}
