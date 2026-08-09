"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeOptionalInternalReturnPath } from "@/lib/return-path";

function RegisterForm() {
  const searchParams = useSearchParams();
  const returnPath = normalizeOptionalInternalReturnPath(searchParams.get("return"));
  const signUpHref = `/api/auth/logto/sign-up${returnPath ? `?return=${encodeURIComponent(returnPath)}` : ""}`;
  const loginHref = `/login${returnPath ? `?return=${encodeURIComponent(returnPath)}` : ""}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-none shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-inter font-bold text-neutral-900 mb-2">Начать бесплатно</h1>
        <p className="text-neutral-500 text-sm">Стресс-тест аргументов перед рабочей встречей</p>
      </div>

      <a href={signUpHref} className="w-full bg-[#171717] hover:bg-black text-white font-medium rounded-none py-3.5 text-xs font-semibold h-11 transition-colors flex items-center justify-center">
        Создать аккаунт через Logto
      </a>
      <p className="mt-4 text-center text-xs text-neutral-500">Подтверждение email и пароль настраиваются в защищённом окне Logto.</p>

      <p className="mt-6 text-xs text-center text-neutral-400">
        Нажимая кнопку, вы соглашаетесь с{" "}
        <a href="/personal-data" className="underline hover:text-neutral-900">Офертой</a> и{" "}
        <a href="/privacy" className="underline hover:text-neutral-900">Политикой конфиденциальности</a>.
      </p>

      <div className="mt-8 text-center text-sm text-neutral-500 border-t border-neutral-200 pt-8">
        Уже есть аккаунт?{" "}
        <Link href={loginHref} className="text-neutral-900 hover:text-black transition-colors font-medium">Войти</Link>
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={<div>Загрузка...</div>}><RegisterForm /></Suspense>;
}
