"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
      if (result.error) {
        setError("Не удалось отправить письмо. Попробуйте ещё раз.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Не удалось отправить письмо. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-panel" onSubmit={submit} aria-busy={busy}>
      <div className="auth-heading">
        <p className="auth-kicker">Восстановление</p>
        <h2>Забыли пароль?</h2>
        <p>{sent ? "Если аккаунт существует, письмо уже отправлено." : "Укажите email — мы отправим ограниченную по времени ссылку."}</p>
      </div>
      {!sent && (
        <>
          <label className="auth-field" htmlFor="forgot-email"><span>Email</span><input id="forgot-email" name="email" aria-label="Email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button disabled={busy} className="auth-primary-button">{busy ? "Отправляем…" : "Получить ссылку"}</button>
        </>
      )}
      {sent && <p className="auth-success" role="status">Проверьте входящие и папку «Спам».</p>}
      <p className="auth-secondary-link"><Link href="/login">Вернуться ко входу</Link></p>
    </form>
  );
}
