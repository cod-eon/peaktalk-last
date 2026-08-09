"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Suspense, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { CheckCircle2 } from "lucide-react";
import { translateAuthError } from "@/lib/authErrors";
import { getUTM } from "@/lib/utm";
import { normalizeOptionalInternalReturnPath } from "@/lib/return-path";

function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const captchaRef = useRef<HCaptcha>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = normalizeOptionalInternalReturnPath(searchParams.get('return'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const nextUrl = returnUrl ? `/onboarding?return=${encodeURIComponent(returnUrl)}` : '/onboarding';

    const supabase = createClient();
    const utm = getUTM();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name, ...utm },
        captchaToken,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
      },
    });

    captchaRef.current?.resetCaptcha();
    setCaptchaToken(undefined);

    if (signUpError) {
      setError(translateAuthError(signUpError.message));
      setIsLoading(false);
      return;
    }

    // Если сессии нет после регистрации, значит требуется подтверждение по почте
    if (!signUpData.session) {
      setIsLoading(false);
      setIsSuccess(true);
      return;
    }

router.push(nextUrl);
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
          Мы отправили письмо с ссылкой для подтверждения на <span className="font-medium text-[color:var(--pt-ink)]">{email}</span>. Перейдите по ссылке в письме.
        </p>
        <button
          onClick={() => setIsSuccess(false)}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-[color:var(--pt-bg)] px-4 text-xs font-semibold text-[color:var(--pt-muted)] transition-colors hover:text-[color:var(--pt-ink)]"
        >
          Вернуться назад
        </button>
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
        <h1 className="mb-2 font-display text-3xl font-semibold tracking-[-0.04em] text-[color:var(--pt-ink)]">Начать бесплатно</h1>
        <p className="text-sm text-[color:var(--pt-muted)]">
          Разберите материал перед выступлением или встречей
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-[18px] border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-semibold text-[color:var(--pt-muted)]">
            Как к вам обращаться
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-[18px] border border-[color:var(--pt-line)] bg-[color:var(--pt-bg)] px-4 py-3 text-sm text-[color:var(--pt-ink)] placeholder:text-[color:var(--pt-faint)] transition-all focus:border-[color:var(--pt-cobalt)] focus:outline-none focus:ring-2 focus:ring-[rgba(37,87,214,0.12)]"
            placeholder="Анна Петрова"
          />
        </div>

        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-semibold text-[color:var(--pt-muted)]">
            Рабочая почта
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[18px] border border-[color:var(--pt-line)] bg-[color:var(--pt-bg)] px-4 py-3 text-sm text-[color:var(--pt-ink)] placeholder:text-[color:var(--pt-faint)] transition-all focus:border-[color:var(--pt-cobalt)] focus:outline-none focus:ring-2 focus:ring-[rgba(37,87,214,0.12)]"
            placeholder="anna@company.ru"
          />
        </div>

        <div className="space-y-1.5">
          <label className="ml-1 block text-xs font-semibold text-[color:var(--pt-muted)]">
            Надежный пароль
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[18px] border border-[color:var(--pt-line)] bg-[color:var(--pt-bg)] px-4 py-3 text-sm text-[color:var(--pt-ink)] placeholder:text-[color:var(--pt-faint)] transition-all focus:border-[color:var(--pt-cobalt)] focus:outline-none focus:ring-2 focus:ring-[rgba(37,87,214,0.12)]"
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
          className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[color:var(--pt-ink)] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--pt-cobalt)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>Зарегистрироваться</span>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs leading-6 text-[color:var(--pt-muted)]">
        Нажимая кнопку, вы соглашаетесь с{" "}
        <a href="/personal-data" className="inline-flex min-h-10 items-center underline hover:text-[color:var(--pt-ink)]">Офертой</a> и{" "}
        <a href="/privacy" className="inline-flex min-h-10 items-center underline hover:text-[color:var(--pt-ink)]">Политикой конфиденциальности</a>.
      </p>

      <div className="mt-8 border-t border-[color:var(--pt-line)] pt-6 text-center text-sm text-[color:var(--pt-muted)]">
        Уже есть аккаунт?{" "}
        <Link href={`/login${returnUrl ? `?return=${encodeURIComponent(returnUrl)}` : ''}`} className="inline-flex min-h-9 items-center font-semibold text-[color:var(--pt-ink)] transition-colors hover:text-[color:var(--pt-cobalt)]">
          Войти
        </Link>
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
