import Link from "next/link";
import { ReactNode } from "react";
import { CheckCircle2, FileText, Layers3, MessageSquareText } from "lucide-react";

const authSteps = [
  { label: "Материал", icon: FileText },
  { label: "Вопросы", icon: MessageSquareText },
  { label: "Пакет", icon: Layers3 },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[color:var(--pt-bg)] text-[color:var(--pt-ink)]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:var(--pt-line)] bg-[color:var(--pt-bg)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex min-h-10 items-center font-display text-[18px] font-extrabold tracking-[-0.03em]">
            PeakTalk
          </Link>
          <Link href="/simulation/guest" className="inline-flex min-h-10 items-center text-[13px] font-semibold text-[color:var(--pt-cobalt)]">
            Быстрый разбор
          </Link>
        </div>
      </header>

      <main className="flex min-h-[100dvh] items-center px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-[1160px] gap-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-stretch">
          <section className="hidden min-h-[640px] rounded-[34px] border border-[color:var(--pt-line)] bg-white p-8 shadow-[0_30px_100px_rgba(20,34,55,0.08)] lg:flex lg:flex-col lg:justify-between">
            <p className="text-[13px] font-semibold text-[color:var(--pt-cobalt)]">
              Кабинет PeakTalk
            </p>
            <div>
              <h1 className="mt-5 max-w-[640px] font-display text-[56px] font-extrabold leading-[0.98] tracking-[-0.055em]">
                Материалы, версии и проверки рядом
              </h1>
              <p className="mt-6 max-w-[54ch] text-[17px] leading-8 text-[color:var(--pt-muted)]">
                Войдите, чтобы вернуться к файлам, вопросам системы и готовым пакетам без поиска по чатам.
              </p>
            </div>

            <div className="rounded-[30px] border border-[color:var(--pt-line)] bg-[color:var(--pt-bg)] p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {authSteps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.label}
                      className={`rounded-[22px] border p-4 ${
                        index === 1
                          ? "border-[color:var(--pt-cobalt)] bg-[color:var(--pt-cobalt-soft)]"
                          : "border-[color:var(--pt-line)] bg-white"
                      }`}
                    >
                      <span className="flex size-10 items-center justify-center rounded-[15px] bg-white text-[color:var(--pt-cobalt)] shadow-[0_10px_24px_rgba(20,34,55,0.06)]">
                        <Icon size={20} strokeWidth={1.8} />
                      </span>
                      <p className="mt-5 text-[13px] font-semibold text-[color:var(--pt-muted)]">
                        0{index + 1}
                      </p>
                      <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">
                        {step.label}
                      </h2>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-[22px] bg-[color:var(--pt-ink)] p-5 text-white">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                    <CheckCircle2 size={17} strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">После входа</p>
                    <p className="mt-2 text-[14px] leading-6 text-white/68">
                      Откроются ваши материалы, версии и история проверок.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-[calc(100dvh-8.5rem)] items-center justify-center lg:min-h-[640px]">
            <div className="w-full max-w-md">
              {children}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
