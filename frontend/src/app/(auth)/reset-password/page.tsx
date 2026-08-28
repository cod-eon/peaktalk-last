"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { translateAuthError } from "@/lib/authErrors";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) setError(translateAuthError(result.error.message));
      else setDone(true);
    } catch {
      setError("Не удалось изменить пароль. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) return <div className="auth-panel"><div className="auth-heading"><p className="auth-kicker">Ссылка истекла</p><h2>Нужна новая ссылка</h2><p>Ссылка восстановления недействительна или уже была использована.</p></div><Link className="auth-primary-button" href="/forgot-password">Запросить новую ссылку</Link><p className="auth-secondary-link"><Link href="/login">Вернуться ко входу</Link></p></div>;
  if (done) return <div className="auth-panel"><div className="auth-heading"><p className="auth-kicker">Готово</p><h2>Пароль изменён</h2><p>Остальные сессии завершены. Войдите с новым паролем.</p></div><Link className="auth-primary-button" href="/login">Войти</Link></div>;

  return <form className="auth-panel" onSubmit={submit} aria-busy={busy}><div className="auth-heading"><p className="auth-kicker">Новый доступ</p><h2>Новый пароль</h2><p>Используйте минимум 10 символов.</p></div><label className="auth-field" htmlFor="reset-password"><span>Новый пароль</span><input id="reset-password" name="password" aria-label="Новый пароль" type="password" minLength={10} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button disabled={busy} className="auth-primary-button">{busy ? "Сохраняем…" : "Сохранить пароль"}</button></form>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="auth-loading" role="status"><span className="auth-spinner" aria-hidden="true" />Загружаем форму…</div>}><ResetPasswordForm /></Suspense>;
}
