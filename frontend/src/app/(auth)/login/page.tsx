"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useRef, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { translateAuthError } from "@/lib/authErrors";
import { normalizeInternalReturnPath, normalizeOptionalInternalReturnPath } from "@/lib/return-path";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const captchaRef = useRef<HCaptcha>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const normalizedReturnUrl = normalizeOptionalInternalReturnPath(searchParams.get('return'));
  const getReturnUrl = () => normalizeInternalReturnPath(searchParams.get('return'));

  const getOnboardingUrl = (returnUrl: string) => {
    if (returnUrl.startsWith('/onboarding')) {
      return returnUrl;
    }

    return `/onboarding?return=${encodeURIComponent(returnUrl)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    });

    captchaRef.current?.resetCaptcha();
    setCaptchaToken(undefined);

    if (signInError) {
      setError(translateAuthError(signInError.message));
      setIsLoading(false);
      return;
    }

    const returnUrl = getReturnUrl();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const meRes = await fetch(`${apiUrl}/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (meRes.ok) {
          const me = await meRes.json();
          router.push(me?.onboarding_profile ? returnUrl : getOnboardingUrl(returnUrl));
          router.refresh();
          return;
        }
      } catch {
        // Keep the existing redirect if the profile check is unavailable.
      }
    }

    router.push(returnUrl);
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[30px] border border-[color:var(--pt-line)] bg-white p-6 shadow-[0_24px_80px_rgba(20,34,55,0.08)] sm:p-8"
    >
      <div className="text-center mb-8">
        <h1 className="mb-2 font-display text-3xl font-semibold tracking-[-0.04em] text-[color:var(--pt-ink)]">С возвращением</h1>
        <p className="text-sm text-[color:var(--pt-muted)]">
          Войдите, чтобы продолжить подготовку
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-[18px] border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-semibold text-[color:var(--pt-muted)]">
            Почта
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[18px] border border-[color:var(--pt-line)] bg-[color:var(--pt-bg)] px-4 py-3 text-sm text-[color:var(--pt-ink)] placeholder:text-[color:var(--pt-faint)] transition-all focus:border-[color:var(--pt-cobalt)] focus:outline-none focus:ring-2 focus:ring-[rgba(37,87,214,0.12)]"
            placeholder="arthur@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center ml-1">
            <label className="text-xs font-semibold text-[color:var(--pt-muted)]">
              Пароль
            </label>
            <Link
              href="/forgot-password"
              className="inline-flex min-h-9 items-center text-xs font-semibold text-[color:var(--pt-cobalt)] transition-colors hover:text-[color:var(--pt-cobalt-strong)]"
            >
              Забыли пароль?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[18px] border border-[color:var(--pt-line)] bg-[color:var(--pt-bg)] px-4 py-3 text-sm text-[color:var(--pt-ink)] placeholder:text-[color:var(--pt-faint)] transition-all focus:border-[color:var(--pt-cobalt)] focus:outline-none focus:ring-2 focus:ring-[rgba(37,87,214,0.12)]"
            placeholder="••••••••"
          />
        </div>

        <div className="flex justify-center">
          <HCaptcha
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY!}
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(undefined)}
            ref={captchaRef}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !captchaToken}
          className="mt-4 flex h-12 w-full items-center justify-center overflow-hidden rounded-full bg-[color:var(--pt-ink)] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--pt-cobalt)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>Войти в систему</span>
          )}
        </button>
      </form>
      <div className="mt-8 border-t border-[color:var(--pt-line)] pt-6 text-center text-sm text-[color:var(--pt-muted)]">
        Нет аккаунта?{" "}
        <Link href={`/register${normalizedReturnUrl ? `?return=${encodeURIComponent(normalizedReturnUrl)}` : ''}`} className="inline-flex min-h-9 items-center font-semibold text-[color:var(--pt-ink)] transition-colors hover:text-[color:var(--pt-cobalt)]">
          Создать бесплатно
        </Link>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <LoginForm />
    </Suspense>
  );
}
