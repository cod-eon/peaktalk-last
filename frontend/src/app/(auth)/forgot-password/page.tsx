"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-none shadow-[0_4px_24px_rgba(0,0,0,0.07)] text-center"
    >
      <h1 className="text-2xl font-inter font-bold text-neutral-900 mb-2">Восстановление доступа</h1>
      <p className="text-neutral-500 text-sm mb-8">
        Logto отправит письмо для восстановления пароля в защищённом окне.
      </p>
      <a href="/api/auth/logto/sign-in" className="w-full bg-[#171717] hover:bg-black text-white font-medium rounded-none py-3.5 text-xs font-semibold h-11 transition-colors flex items-center justify-center">
        Открыть восстановление пароля
      </a>
      <div className="mt-8 text-sm text-neutral-500">
        <Link href="/login" className="text-neutral-900 hover:text-black font-medium">Вернуться ко входу</Link>
      </div>
    </motion.div>
  );
}
