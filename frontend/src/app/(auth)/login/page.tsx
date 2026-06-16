"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useRef, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { translateAuthError } from "@/lib/authErrors";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const captchaRef = useRef<HCaptcha>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const getReturnUrl = () => {
    const returnUrl = searchParams.get('return');

    return returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/dashboard';
  };

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
      className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-none shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-inter font-bold text-neutral-900 mb-2">С возвращением</h1>
        <p className="text-neutral-500 text-sm">
          Войдите, чтобы продолжить подготовку
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-none">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-neutral-500 uppercase tracking-wider block ml-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-inter"
            placeholder="arthur@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center ml-1">
            <label className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
              Пароль
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-neutral-900 hover:text-black transition-colors"
            >
              Забыли пароль?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-inter"
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
          className="w-full bg-[#171717] hover:bg-black text-white font-medium rounded-none py-3.5 text-xs font-semibold relative overflow-hidden group mt-4 h-11 transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>Войти в систему</span>
          )}
        </button>
      </form>
      <div className="mt-8 text-center text-sm text-neutral-500">
        Нет аккаунта?{" "}
        <Link href={`/register${searchParams.get('return') ? `?return=${encodeURIComponent(searchParams.get('return')!)}` : ''}`} className="text-neutral-900 hover:text-black transition-colors font-medium">
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
