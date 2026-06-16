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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const returnUrl = searchParams.get('return');
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
        className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-none shadow-[0_4px_24px_rgba(0,0,0,0.07)] text-center"
      >
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-inter font-bold text-neutral-900 mb-2">Проверьте почту</h2>
        <p className="text-neutral-500 text-sm mb-6">
          Мы отправили письмо с ссылкой для подтверждения на <span className="font-medium text-neutral-900">{email}</span>. Пожалуйста, перейдите по ссылке в письме.
        </p>
        <button
          onClick={() => setIsSuccess(false)}
          className="text-xs font-medium text-neutral-400 hover:text-neutral-900 transition-colors uppercase tracking-wider"
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
      className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-none shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-inter font-bold text-neutral-900 mb-2">Начать бесплатно</h1>
        <p className="text-neutral-500 text-sm">
          Стресс-тест аргументов перед рабочей встречей
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-none">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-neutral-500 uppercase tracking-wider block ml-1">
            Как к вам обращаться
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-inter"
            placeholder="Илон Маск"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-neutral-500 uppercase tracking-wider block ml-1">
            Рабочий Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-inter"
            placeholder="elon@spacex.com"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-neutral-500 uppercase tracking-wider block ml-1">
            Надежный пароль
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-4 py-3 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all font-inter"
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
          className="w-full bg-[#171717] hover:bg-black text-white font-medium rounded-none py-3.5 text-xs font-semibold mt-6 h-11 transition-colors flex items-center justify-center"
        >
          {isLoading ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>Зарегистрироваться</span>
          )}
        </button>
      </form>

      <p className="mt-6 text-xs text-center text-neutral-400">
        Нажимая кнопку, вы соглашаетесь с{" "}
        <a href="/personal-data" className="underline hover:text-neutral-900">Офертой</a> и{" "}
        <a href="/privacy" className="underline hover:text-neutral-900">Политикой конфиденциальности</a>.
      </p>

      <div className="mt-8 text-center text-sm text-neutral-500 border-t border-neutral-200 pt-8">
        Уже есть аккаунт?{" "}
        <Link href={`/login${searchParams.get('return') ? `?return=${encodeURIComponent(searchParams.get('return')!)}` : ''}`} className="text-neutral-900 hover:text-black transition-colors font-medium">
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
