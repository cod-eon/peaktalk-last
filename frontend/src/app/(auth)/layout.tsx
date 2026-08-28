"use client";

import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell">
      <div className="auth-grid" aria-hidden="true" />
      <header className="auth-header">
        <div className="auth-container">
          <Link href="/" className="auth-brand" aria-label="PeakTalk. На главную">
            <Image src="/logo_svg.svg" alt="" width={44} height={44} priority />
            <span className="brand-wordmark">PeakTalk</span>
          </Link>
        </div>
      </header>
      <main className="auth-main">
        <div className="auth-card">
          <aside className="auth-aside" aria-label="Как работает PeakTalk">
            <p className="auth-kicker">PeakTalk / access</p>
            <h1>Защитите важную идею до того, как войдёте в переговорную.</h1>
            <ol className="auth-steps">
              <li>Материал</li><li>Слабые места</li><li>Adversarial simulation</li><li>Defense Brief</li>
            </ol>
          </aside>
          <section className="auth-content" aria-live="polite">{children}</section>
        </div>
      </main>
    </div>
  );
}
