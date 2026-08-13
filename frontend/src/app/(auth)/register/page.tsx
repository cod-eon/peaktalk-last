"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { normalizeOptionalInternalReturnPath } from "@/lib/return-path";

function RegisterForm() {
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const returnPath = normalizeOptionalInternalReturnPath(params.get("return")) ?? "/onboarding";

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signUp.email({ name, email, password, callbackURL: `/verify-email?return=${encodeURIComponent(returnPath)}` });
      if (result.error) setError(result.error.message ?? "Не удалось создать аккаунт");
      else setSent(true);
    } catch {
      setError("Не удалось создать аккаунт. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) return <div className="auth-panel"><div className="auth-heading"><p className="auth-kicker">Письмо отправлено</p><h2>Подтвердите email</h2><p role="status">Откройте ссылку в письме. Она действует ограниченное время.</p></div><Link className="auth-primary-button" href={`/verify-email?return=${encodeURIComponent(returnPath)}`}>Продолжить</Link></div>;
  return <form className="auth-panel" onSubmit={submit} aria-busy={busy}><div className="auth-heading"><p className="auth-kicker">Первый шаг</p><h2>Создать аккаунт</h2><p>Используйте рабочий email и надёжный пароль.</p></div><label className="auth-field" htmlFor="register-name"><span>Имя</span><input id="register-name" name="name" aria-label="Имя" required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label><label className="auth-field" htmlFor="register-email"><span>Email</span><input id="register-email" name="email" aria-label="Email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="auth-field" htmlFor="register-password"><span>Пароль (минимум 10 символов)</span><input id="register-password" name="password" aria-label="Пароль (минимум 10 символов)" type="password" minLength={10} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button disabled={busy} className="auth-primary-button">{busy ? "Создаём…" : "Создать аккаунт"}</button><p className="auth-legal">Продолжая, вы соглашаетесь с <a href="/personal-data">Офертой</a> и <a href="/privacy">Политикой</a>.</p><p className="auth-secondary-link"><Link href={`/login?return=${encodeURIComponent(returnPath)}`}>Уже есть аккаунт</Link></p></form>;
}

export default function RegisterPage() {
  return <Suspense fallback={<div className="auth-loading" role="status"><span className="auth-spinner" aria-hidden="true" />Загружаем регистрацию…</div>}><RegisterForm /></Suspense>;
}
