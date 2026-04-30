'use client'

import Link from 'next/link'

export default function AuthError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF8F4] px-4">
      <section className="w-full max-w-md border border-neutral-950 bg-white p-6 shadow-[8px_8px_0_rgba(232,96,10,0.18)]">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#E8600A]">auth error</div>
        <h1 className="mt-4 font-inter text-2xl font-black text-neutral-950">Не удалось открыть вход</h1>
        <p className="mt-3 font-inter text-sm leading-6 text-neutral-600">Попробуйте ещё раз или вернитесь на главную.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="min-h-11 border border-neutral-950 bg-neutral-950 px-4 font-inter text-sm font-bold text-white">Повторить</button>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center border border-neutral-200 px-4 font-inter text-sm font-semibold text-neutral-800">На главную</Link>
        </div>
      </section>
    </main>
  )
}
