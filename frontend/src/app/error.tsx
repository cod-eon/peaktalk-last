'use client'

import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF8F4] px-4">
      <section className="w-full max-w-xl border border-neutral-950 bg-white p-6 shadow-[8px_8px_0_rgba(232,96,10,0.18)]">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#E8600A]">
          runtime exception
        </div>
        <h1 className="mt-4 font-inter text-3xl font-black text-neutral-950">
          Интерфейс не выдержал этот сценарий
        </h1>
        <p className="mt-3 font-inter text-sm leading-6 text-neutral-600">
          Мы сохранили контекст ошибки. Попробуйте перезагрузить блок или вернуться к сценариям.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-neutral-400">ID: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 border border-neutral-950 bg-neutral-950 px-4 font-inter text-sm font-bold text-white"
          >
            Повторить
          </button>
          <Link
            href="/scenarios"
            className="inline-flex min-h-11 items-center justify-center border border-neutral-200 px-4 font-inter text-sm font-semibold text-neutral-800"
          >
            Открыть сценарии
          </Link>
        </div>
      </section>
    </main>
  )
}
