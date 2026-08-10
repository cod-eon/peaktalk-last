"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeOptionalInternalReturnPath } from "@/lib/return-path";

function LoginForm() {
  const searchParams = useSearchParams();
  const returnPath = normalizeOptionalInternalReturnPath(searchParams.get("return"));
  const signInHref = `/api/auth/logto/sign-in${returnPath ? `?return=${encodeURIComponent(returnPath)}` : ""}`;
  const signUpHref = `/register${returnPath ? `?return=${encodeURIComponent(returnPath)}` : ""}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white p-6 sm:p-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-inter font-bold text-neutral-900 mb-2">Войти</h1>
        <p className="text-neutral-500 text-sm">Войдите в PeakTalk, чтобы продолжить.</p>
      </div>

      <a href={signInHref} className="w-full bg-[#171717] hover:bg-[#e8600a] text-white font-medium py-3.5 text-xs font-semibold h-11 transition-colors flex items-center justify-center">
        Войти
      </a>
      <p className="mt-4 text-center text-xs text-neutral-500">Email и пароль вводятся на странице PeakTalk.</p>

      <div className="mt-8 text-center text-sm text-neutral-500">
        Нет аккаунта?{" "}
        <Link href={signUpHref} className="text-neutral-900 hover:text-black transition-colors font-medium">
          Создать бесплатно
        </Link>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div>Загрузка...</div>}><LoginForm /></Suspense>;
}
