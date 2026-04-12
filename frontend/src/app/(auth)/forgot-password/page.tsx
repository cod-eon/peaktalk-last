"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { CheckCircle2 } from "lucide-react";

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
      setError(resetError.message);
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
        className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-none shadow-[0_4px_24px_rgba(0,0,0,0.07)] text-center"
      >
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-inter font-bold text-neutral-900 mb-2">Проверьте почту</h2>
        <p className="text-neutral-500 text-sm mb-6">
          Мы отправили письмо с ссылкой для восстановления пароля на <span className="font-medium text-neutral-900">{email}</span>. Пожалуйста, перейдите по ссылке в письме.
        </p>
        <Link
          href="/login"
          className="text-xs font-medium text-neutral-400 hover:text-neutral-900 transition-colors uppercase tracking-wider"
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
      className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-none shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-inter font-bold text-neutral-900 mb-2">Забыли пароль?</h1>
        <p className="text-neutral-500 text-sm">
          Введите ваш Email, и мы вышлем ссылку для восстановления
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
            <span>Отправить письмо</span>
          )}
        </button>
      </form>

      <div className="mt-8 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-neutral-400">Или</span>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-neutral-500">
        Вспомнили пароль?{" "}
        <Link href="/login" className="text-neutral-900 hover:text-black transition-colors font-medium">
          Войти
        </Link>
      </div>
    </motion.div>
  );
}
