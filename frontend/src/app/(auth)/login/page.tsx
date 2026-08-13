"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { normalizeOptionalInternalReturnPath } from "@/lib/return-path";
import { translateAuthError } from "@/lib/authErrors";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const returnPath = normalizeOptionalInternalReturnPath(params.get("return")) ?? "/dashboard";

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signIn.email({ email, password, callbackURL: returnPath });
      if (result.error) setError(translateAuthError(result.error.message));
      else router.replace(returnPath);
    } catch {
      setError("Не удалось войти. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="auth-panel" onSubmit={submit} aria-busy={busy}><div className="auth-heading"><p className="auth-kicker">Добро пожаловать</p><h2>Войти в PeakTalk</h2><p>Продолжите подготовку к важной встрече.</p></div><label className="auth-field" htmlFor="login-email"><span>Email</span><input id="login-email" name="email" aria-label="Email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="auth-field" htmlFor="login-password"><span>Пароль</span><input id="login-password" name="password" aria-label="Пароль" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button disabled={busy} className="auth-primary-button">{busy ? "Входим…" : "Войти"}</button><p className="auth-secondary-link"><Link href="/forgot-password">Забыли пароль?</Link></p><p className="auth-secondary-link">Нет аккаунта? <Link href={`/register?return=${encodeURIComponent(returnPath)}`}>Создать</Link></p></form>;
}

export default function LoginPage() {
  return <Suspense fallback={<div className="auth-loading" role="status"><span className="auth-spinner" aria-hidden="true" />Загружаем вход…</div>}><LoginForm /></Suspense>;
}
