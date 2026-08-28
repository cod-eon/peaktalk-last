'use client'

import Link from "next/link";

export default function AuthError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="auth-shell">
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-main">
        <section className="auth-card auth-state-card" aria-labelledby="auth-error-title">
          <div className="auth-content">
            <div className="auth-panel">
              <p className="auth-kicker">Ошибка доступа</p>
              <h1 id="auth-error-title" className="auth-state-title">Не удалось открыть вход</h1>
              <p className="auth-state-copy" role="alert">Попробуйте ещё раз или безопасно вернитесь на главную.</p>
              <button type="button" onClick={reset} className="auth-primary-button">Повторить</button>
              <p className="auth-secondary-link"><Link href="/">На главную</Link></p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
