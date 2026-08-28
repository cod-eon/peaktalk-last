import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="auth-shell">
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-main">
        <section className="auth-card auth-state-card" aria-labelledby="unauthorized-title">
          <div className="auth-content">
            <div className="auth-panel">
              <p className="auth-kicker">401 / доступ закрыт</p>
              <h1 id="unauthorized-title" className="auth-state-title">Нужно войти в PeakTalk</h1>
              <p className="auth-state-copy">Сессия отсутствует или истекла. После входа вы сможете безопасно продолжить работу.</p>
              <Link className="auth-primary-button" href="/login">Войти</Link>
              <p className="auth-secondary-link"><Link href="/">На главную</Link></p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
