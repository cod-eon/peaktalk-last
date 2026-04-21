import Link from 'next/link';
import { ArrowLeft, Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f1ea] px-5 py-10 sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,96,10,0.14),transparent_26%),radial-gradient(circle_at_80%_12%,rgba(17,24,39,0.1),transparent_22%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.03)_1px,transparent_1px),linear-gradient(rgba(17,24,39,0.03)_1px,transparent_1px)] bg-[length:42px_42px]" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative overflow-hidden border border-black/10 bg-white/88 px-6 py-8 shadow-[0_30px_90px_rgba(17,24,39,0.12)] backdrop-blur sm:px-8 sm:py-10">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(232,96,10,0.32),transparent)]" />
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-neutral-500">Routing / Exception</div>
          <h1 className="mt-5 font-syne text-[42px] leading-[0.92] tracking-[-0.06em] text-neutral-950 sm:text-[58px]">
            Маршрут исчез,
            <br />
            смысла нет.
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-8 text-neutral-700">
            Такой страницы здесь нет. Возможно, ссылка устарела, путь изменился или вы ушли в несуществующую ветку интерфейса.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              <Home size={16} />
              На главную
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-black/10 bg-white px-5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100"
            >
              <Compass size={16} />
              В дашборд
            </Link>
            <Link
              href="/scenarios"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-[rgba(232,96,10,0.18)] bg-[rgba(232,96,10,0.08)] px-5 text-sm font-semibold text-[#9a4307] transition-colors hover:bg-[rgba(232,96,10,0.14)]"
            >
              <ArrowLeft size={16} />
              Открыть сценарии
            </Link>
          </div>
        </section>

        <section className="relative grid gap-4">
          <div className="relative overflow-hidden border border-black/10 bg-[#111827] px-6 py-8 text-white shadow-[0_30px_90px_rgba(17,24,39,0.2)]">
            <div className="absolute inset-y-0 right-0 w-44 bg-[radial-gradient(circle_at_center,rgba(232,96,10,0.3),transparent_68%)]" />
            <div className="relative flex items-end gap-3 sm:gap-5">
              <span className="font-syne text-[96px] leading-none tracking-[-0.08em] text-white/92 sm:text-[150px]">4</span>
              <span className="translate-y-4 border border-white/10 bg-white/5 px-4 py-2 font-syne text-[72px] leading-none tracking-[-0.08em] text-[#f6b153] sm:text-[112px]">
                0
              </span>
              <span className="-translate-y-3 font-syne text-[96px] leading-none tracking-[-0.08em] text-white/66 sm:text-[150px]">4</span>
            </div>
            <p className="relative mt-6 max-w-md text-sm leading-7 text-white/72">
              Это не шаблонный 404. Экран отмечает потерянный маршрут как операционное состояние, а не как случайную ошибку браузера.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: 'Почему это заметно',
                description: 'Центральная цифра 0 вынесена в отдельную пластину. Даже без логотипа экран легко узнаётся.',
              },
              {
                title: 'Почему это полезно',
                description: 'Пользователь сразу получает три понятных выхода: домой, в рабочий кабинет или к сценариям.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="border border-black/10 bg-white/88 px-5 py-5 shadow-[0_22px_60px_rgba(17,24,39,0.08)] backdrop-blur"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-neutral-500">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-neutral-700">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
