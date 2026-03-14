"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        data: {
          display_name: name,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[var(--bg-card)]/80 backdrop-blur-xl border border-[var(--border-main)] p-8 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
    >
      <div className="text-center mb-8">
        <h1 className="text-2xl font-syne font-semibold text-slate-100 mb-2">Начать бесплатно</h1>
        <p className="text-slate-400 text-sm">
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
          <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block ml-1">
            Как к вам обращаться
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-inter"
            placeholder="Илон Маск"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block ml-1">
            Рабочий Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-inter"
            placeholder="elon@spacex.com"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block ml-1">
            Надежный пароль
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-inter"
            placeholder="Минимум 8 символов"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary py-3.5 text-xs font-semibold mt-6 h-11"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          ) : (
            <span>Зарегистрироваться</span>
          )}
        </button>
      </form>

      <p className="mt-5 text-xs text-center text-slate-500">
        Нажимая кнопку, вы соглашаетесь с{" "}
        <a href="#" className="underline hover:text-slate-300">Условиями</a> и{" "}
        <a href="#" className="underline hover:text-slate-300">Политикой 152-ФЗ</a>.
      </p>

      <div className="mt-8 text-center text-sm text-slate-400">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
          Войти
        </Link>
      </div>
    </motion.div>
  );
}
