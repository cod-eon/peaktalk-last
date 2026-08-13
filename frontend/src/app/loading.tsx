export default function Loading() {
  return (
    <main className="auth-shell" aria-busy="true">
      <div className="auth-grid" aria-hidden="true" />
      <div className="auth-main">
        <div className="auth-loading" role="status"><span className="auth-spinner" aria-hidden="true" />Загружаем PeakTalk…</div>
      </div>
    </main>
  );
}
