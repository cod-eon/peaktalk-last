"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const captchaRef = useRef<HCaptcha>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        captchaToken,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });

    captchaRef.current?.resetCaptcha();
    setCaptchaToken(undefined);

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    // Если сессии нет после регистрации, значит требуется подтверждение по почте
    if (!signUpData.session) {
      setIsLoading(false);
      setIsSuccess(true);
      return;
    }

    router.push('/onboarding');
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
          Умная подготовка к выступлениям за 3 шага
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

      <div className="mt-8 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-neutral-400">Или продолжить через</span>
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
          className="flex-1 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-none py-2.5 flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-sm font-medium text-neutral-500">Зарегистрироваться через Google</span>
        </button>
      </div>

      <p className="mt-6 text-xs text-center text-neutral-400">
        Нажимая кнопку, вы соглашаетесь с{" "}
        <a href="/personal-data" className="underline hover:text-neutral-900">Офертой</a> и{" "}
        <a href="/privacy" className="underline hover:text-neutral-900">Политикой конфиденциальности</a>.
      </p>

      <div className="mt-8 text-center text-sm text-neutral-500 border-t border-neutral-200 pt-8">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-neutral-900 hover:text-black transition-colors font-medium">
          Войти
        </Link>
      </div>
    </motion.div>
  );
}
