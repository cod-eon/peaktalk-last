"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function RegisterPage() {
  const [name, setName] = useState("");
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
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        captchaToken,
      },
    });

    captchaRef.current?.resetCaptcha();
    setCaptchaToken(undefined);

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    router.push('/onboarding');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-[var(--border-main)] p-6 sm:p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-syne font-semibold text-[var(--text-main)] mb-2">Начать бесплатно</h1>
        <p className="text-[var(--text-muted)] text-sm">
          Умная подготовка к выступлениям за 3 шага
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider block ml-1">
            Как к вам обращаться
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg px-4 py-3 text-sm text-[var(--text-main)] placeholder-slate-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all font-inter"
            placeholder="Илон Маск"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider block ml-1">
            Рабочий Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg px-4 py-3 text-sm text-[var(--text-main)] placeholder-slate-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all font-inter"
            placeholder="elon@spacex.com"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider block ml-1">
            Надежный пароль
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg px-4 py-3 text-sm text-[var(--text-main)] placeholder-slate-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all font-inter"
            placeholder="Минимум 8 символов"
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
          className="w-full btn-primary py-3.5 text-xs font-semibold mt-6 h-11"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          ) : (
            <span>Зарегистрироваться</span>
          )}
        </button>
      </form>

      <p className="mt-5 text-xs text-center text-[var(--text-dim)]">
        Нажимая кнопку, вы соглашаетесь с{" "}
        <a href="#" className="underline hover:text-[var(--text-main)]">Условиями</a> и{" "}
        <a href="#" className="underline hover:text-[var(--text-main)]">Политикой конфиденциальности</a>.
      </p>

      <div className="mt-8 text-center text-sm text-[var(--text-muted)]">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] transition-colors font-medium">
          Войти
        </Link>
      </div>
    </motion.div>
  );
}
