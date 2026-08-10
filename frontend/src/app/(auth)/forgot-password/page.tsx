"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white p-6 sm:p-8 text-center"
    >
      <h1 className="text-2xl font-inter font-bold text-neutral-900 mb-2">Восстановить пароль</h1>
      <p className="text-neutral-500 text-sm mb-8">
        Откройте форму восстановления и укажите email.
      </p>
      <a href="/api/auth/logto/sign-in?screen=reset_password" className="w-full bg-[#171717] hover:bg-[#e8600a] text-white font-medium rounded-none py-3.5 text-xs font-semibold h-11 transition-colors flex items-center justify-center">
        Восстановить пароль
      </a>
      <div className="mt-8 text-sm text-neutral-500">
        <Link href="/login" className="text-neutral-900 hover:text-black font-medium">Вернуться ко входу</Link>
      </div>
    </motion.div>
  );
}
