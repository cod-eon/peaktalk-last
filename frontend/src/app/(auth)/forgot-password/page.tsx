"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { CheckCircle2 } from "lucide-react";
import { translateAuthError } from "@/lib/authErrors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const captchaRef = useRef<HCaptcha>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      captchaToken,
      redirectTo: `${window.location.origin}/dashboard/settings?reset_password=true`,
    });

    captchaRef.current?.resetCaptcha();
    setCaptchaToken(undefined);

    setIsLoading(false);

    if (resetError) {
      setError(translateAuthError(resetError.message));
      return;
    }

    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[30px] border border-[color:var(--pt-line)] bg-white p-6 text-center shadow-[0_24px_80px_rgba(20,34,55,0.08)] sm:p-8"
      >
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="mb-2 font-display text-3xl font-semibold tracking-[-0.04em] text-[color:var(--pt-ink)]">Проверьте почту</h2>
        <p className="mb-6 text-sm leading-6 text-[color:var(--pt-muted)]">
          Мы отправили письмо с ссылкой для восстановления пароля на <span className="font-medium text-[color:var(--pt-ink)]">{email}</span>. Перейдите по ссылке в письме.
        </p>
        <Link
          href="/login"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-[color:var(--pt-bg)] px-4 text-xs font-semibold text-[color:var(--pt-muted)] transition-colors hover:text-[color:var(--pt-ink)]"
        >
          Вернуться на страницу входа
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[30px] border border-[color:var(--pt-line)] bg-white p-6 shadow-[0_24px_80px_rgba(20,34,55,0.08)] sm:p-8"
    >
      <div className="text-center mb-8">
        <h1 className="mb-2 font-display text-3xl font-semibold tracking-[-0.04em] text-[color:var(--pt-ink)]">Забыли пароль?</h1>
        <p className="text-sm text-[color:var(--pt-muted)]">
          Введите почту, и мы вышлем ссылку для восстановления
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
          className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[color:var(--pt-ink)] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--pt-cobalt)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>Отправить письмо</span>
          )}
        </button>
      </form>

      <div className="mt-8 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[color:var(--pt-line)]"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-[color:var(--pt-muted)]">Или</span>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-[color:var(--pt-muted)]">
        Вспомнили пароль?{" "}
        <Link href="/login" className="inline-flex min-h-9 items-center font-semibold text-[color:var(--pt-ink)] transition-colors hover:text-[color:var(--pt-cobalt)]">
          Войти
        </Link>
      </div>
    </motion.div>
  );
}
