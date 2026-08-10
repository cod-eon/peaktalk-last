"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MailCheck, RefreshCw } from "lucide-react";

import { normalizeInternalReturnPath } from "@/lib/return-path";
import { useAuthStore } from "@/store/authStore";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnPath = normalizeInternalReturnPath(searchParams.get("return"), "/onboarding");
  const user = useAuthStore((state) => state.user);
  const authState = useAuthStore((state) => state.authState);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (authState === "ready") {
      router.replace(returnPath);
    }
  }, [authState, returnPath, router]);

  const refreshSession = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  const restartAuthentication = () => {
    window.location.assign(`/api/auth/logto/sign-in?return=${encodeURIComponent(returnPath)}`);
  };

  return (
    <main className="min-h-screen bg-[#faf8f4] px-4 py-8 text-[#171717] sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden border border-[#d9d5cc] bg-white shadow-[0_24px_80px_rgba(23,23,23,0.08)] lg:grid-cols-[0.82fr_1.18fr]">
          <div className="relative hidden min-h-[520px] overflow-hidden bg-[#171717] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.14) 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
            <div className="relative">
              <Link href="/" className="inline-flex items-center gap-2">
                <Image src="/logo_svg.svg" alt="PeakTalk" width={42} height={42} priority />
                <span className="brand-wordmark text-xl">PeakTalk</span>
              </Link>
              <p className="mt-20 max-w-xs font-mono text-[11px] uppercase tracking-[0.18em] text-[#f29555]">Перед сложным разговором</p>
              <h1 className="mt-4 max-w-sm font-syne text-3xl font-semibold leading-tight">Сначала подтверждаем канал связи.</h1>
            </div>
            <p className="relative max-w-xs text-sm leading-6 text-white/60">После подтверждения email PeakTalk откроет onboarding и сохранит ваш прогресс.</p>
          </div>

          <div className="flex min-h-[520px] flex-col justify-center p-6 sm:p-10 lg:p-14">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2">
                <Image src="/logo_svg.svg" alt="PeakTalk" width={38} height={38} priority />
                <span className="brand-wordmark text-lg">PeakTalk</span>
              </Link>
            </div>
            <div className="flex h-14 w-14 items-center justify-center bg-[#fef3e8] text-[#e8600a]">
              <MailCheck size={28} strokeWidth={1.8} />
            </div>
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-[#e8600a]">Один шаг до PeakTalk</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Подтвердите email</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#6b7280]">
              Мы отправили письмо на <span className="font-medium text-[#171717]">{user?.email ?? "ваш адрес"}</span>. Перейдите по ссылке в письме, затем вернитесь сюда и нажмите «Проверить снова».
            </p>

            <div className="mt-8 border-l-2 border-[#f29555] bg-[#fffaf5] px-4 py-3 text-sm leading-6 text-[#6b7280]">
              Пока email не подтверждён, PeakTalk намеренно не создаёт API-сессию и не открывает onboarding.
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={refreshSession}
                disabled={isRefreshing}
                className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#171717] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#e8600a] disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
                Проверить снова
              </button>
              <button
                type="button"
                onClick={restartAuthentication}
                className="min-h-11 border border-[#d9d5cc] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#171717] transition-colors hover:border-[#171717]"
              >
                Войти заново
              </button>
            </div>
            {authState === "ready" && (
              <p className="mt-5 text-sm text-emerald-700">Email подтверждён. Открываем PeakTalk…</p>
            )}
            <Link href="/" className="mt-8 text-sm text-[#6b7280] underline underline-offset-4 hover:text-[#171717]">Вернуться на главную</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f4]" aria-label="Загрузка" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
