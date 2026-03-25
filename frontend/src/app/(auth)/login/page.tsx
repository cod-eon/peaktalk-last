"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const captchaRef = useRef<HCaptcha>(null);
  const router = useRouter();

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
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-[var(--border-main)] p-6 sm:p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-syne font-semibold text-[var(--text-main)] mb-2">С возвращением</h1>
        <p className="text-[var(--text-muted)] text-sm">
          Войдите, чтобы продолжить подготовку
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider block ml-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg px-4 py-3 text-sm text-[var(--text-main)] placeholder-slate-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all font-inter"
            placeholder="arthur@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center ml-1">
            <label className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
              Пароль
            </label>
            <Link 
              href="/forgot-password" 
              className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors"
            >
              Забыли пароль?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg px-4 py-3 text-sm text-[var(--text-main)] placeholder-slate-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all font-inter"
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
          className="w-full btn-primary py-3.5 text-xs font-semibold relative overflow-hidden group mt-4 h-11"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>Войти в систему</span>
          )}
        </button>
      </form>

      <div className="mt-8 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-main)]"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-[var(--text-dim)]">Или продолжить через</span>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${window.location.origin}/auth/callback` },
            });
          }}
          className="flex-1 bg-white hover:bg-[var(--bg-surface-alt)] border border-[var(--border-main)] rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-sm font-medium text-[var(--text-muted)]">Войти через Google</span>
        </button>
      </div>

      <div className="mt-8 text-center text-sm text-[var(--text-muted)]">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors font-medium">
          Создать бесплатно
        </Link>
      </div>
    </motion.div>
  );
}
