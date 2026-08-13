"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { MailCheck, RefreshCw } from "lucide-react";

import { normalizeInternalReturnPath } from "@/lib/return-path";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/store/authStore";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnPath = normalizeInternalReturnPath(searchParams.get("return"), "/onboarding");
  const user = useAuthStore((state) => state.user);
  const authState = useAuthStore((state) => state.authState);
  const setUser = useAuthStore((state) => state.setUser);
  const setAuthState = useAuthStore((state) => state.setAuthState);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authState === "ready") {
      router.replace(returnPath);
    }
  }, [authState, returnPath, router]);

  const refreshSession = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store", credentials: "include" });
      if (!response.ok) throw new Error("session lookup failed");
      const session = await response.json() as {
        auth_state?: "signed_out" | "email_verification_required" | "ready";
        user?: { sub: string; email?: string | null; email_verified?: boolean; name?: string } | null;
      };
      const nextAuthState = session.auth_state ?? "signed_out";
      const nextUser = session.user?.sub
        ? {
            id: session.user.sub,
            email: session.user.email ?? null,
            email_verified: session.user.email_verified === true,
            user_metadata: { display_name: session.user.name },
          }
        : null;
      setUser(nextUser);
      setAuthState(nextAuthState);
      setIsLoading(false);
      if (nextAuthState === "ready") router.replace(returnPath);
    } catch {
      setError("Не удалось проверить email. Попробуйте ещё раз.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const restartAuthentication = () => {
    window.sessionStorage.removeItem("peaktalk_auth_recovery_started_at");
    window.location.assign(`/login?return=${encodeURIComponent(returnPath)}`);
  };

  const resendVerification = async () => {
    if (!user?.email || isResending) return;
    setIsResending(true);
    setError(null);
    setResendStatus(null);
    try {
      const result = await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: `/verify-email?return=${encodeURIComponent(returnPath)}`,
      });
      if (result.error) {
        setError("Не удалось отправить письмо. Попробуйте ещё раз через несколько минут.");
      } else {
        setResendStatus("Новое письмо отправлено. Проверьте входящие и папку «Спам».");
      }
    } catch {
      setError("Не удалось отправить письмо. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf8f4] px-4 py-8 text-[#171717] sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl items-center justify-center">
        <div className="w-full border border-[#d9d5cc] bg-white p-6 shadow-[0_20px_60px_rgba(23,23,23,0.08)] sm:p-10">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="PeakTalk — на главную">
            <Image src="/logo_svg.svg" alt="PeakTalk" width={38} height={38} priority />
            <span className="brand-wordmark text-lg">PeakTalk</span>
          </Link>
          <div className="mt-12 flex h-12 w-12 items-center justify-center bg-[#fef3e8] text-[#e8600a]" aria-hidden="true">
            <MailCheck size={25} strokeWidth={1.8} />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-[-0.03em]">Подтвердите email</h1>
          <p className="mt-4 text-sm leading-6 text-[#6b7280]">
            Мы отправили письмо на <span className="font-medium text-[#171717]">{user?.email ?? "ваш адрес"}</span>. Откройте ссылку в письме и вернитесь сюда.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={refreshSession}
              disabled={isRefreshing}
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#171717] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#e8600a] disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
              {isRefreshing ? "Проверяем…" : "Проверить email"}
            </button>
            <button
              type="button"
              onClick={restartAuthentication}
              className="min-h-11 border border-[#d9d5cc] px-5 text-xs font-semibold text-[#171717] transition-colors hover:border-[#171717]"
            >
              Войти заново
            </button>
          </div>
          <button
            type="button"
            onClick={resendVerification}
            disabled={!user?.email || isResending}
            className="mt-3 min-h-11 text-left text-sm font-medium text-[#171717] underline underline-offset-4 transition-colors hover:text-[#e8600a] disabled:cursor-not-allowed disabled:text-[#6b7280]"
          >
            {isResending ? "Отправляем письмо…" : "Отправить письмо ещё раз"}
          </button>
          <p className="mt-5 min-h-6 text-sm" aria-live="polite">
            {error ? <span className="text-red-700" role="alert">{error}</span> : resendStatus ? <span className="text-emerald-700">{resendStatus}</span> : authState === "ready" ? <span className="text-emerald-700">Email подтверждён. Открываем PeakTalk…</span> : null}
          </p>
          <Link href="/" className="mt-4 inline-block text-sm text-[#6b7280] underline underline-offset-4 hover:text-[#171717]">На главную</Link>
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
