import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, Layers3, ShieldQuestion } from "lucide-react";
import { MarketingNav } from "@/components/peak/MarketingNav";

const tiers = [
  {
    title: "Первый разбор",
    price: "0 ₽",
    body: "Понять, что можно сделать из материала, и увидеть первые слабые места.",
    items: ["Тип задачи", "Первые риски", "Уточняющие вопросы"],
    icon: FileText,
  },
  {
    title: "Рабочий пакет",
    price: "Подписка",
    body: "Получить речь, выжимку, тайминг, памятку и версии под аудиторию.",
    items: ["Правка текста", "Выжимка главного", "Версии материала"],
    icon: Layers3,
    accent: true,
  },
  {
    title: "Полный комплект",
    price: "Расширенный",
    body: "Добавить презентации, интерактив для событий и несколько раундов проверки.",
    items: ["Мини-презентации", "Интерактив", "Проверка оппонентом"],
    icon: ShieldQuestion,
  },
];

export default function AccessPage() {
  return (
    <main className="min-h-[100dvh] bg-[color:var(--pt-bg)] pt-16 text-[color:var(--pt-ink)]">
      <MarketingNav />

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-4xl">
            <p className="text-[13px] font-semibold text-[color:var(--pt-cobalt)]">
              Стоимость
            </p>
            <h1 className="mt-5 font-display text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[72px]">
              Выберите объем подготовки
            </h1>
            <p className="mt-6 max-w-[68ch] text-[18px] leading-8 text-[color:var(--pt-muted)]">
              Начните с бесплатного разбора на своем файле. Платные уровни открывают конкретные материалы: речь, выжимку, версии, презентацию и проверку.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {tiers.map((tier) => {
              const Icon = tier.icon;

              return (
                <article
                  key={tier.title}
                  className={`flex min-h-[420px] flex-col rounded-[32px] border p-6 shadow-[0_24px_80px_rgba(20,34,55,0.06)] ${
                    tier.accent
                      ? "border-[color:var(--pt-cobalt)] bg-[color:var(--pt-ink)] text-white"
                      : "border-[color:var(--pt-line)] bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`flex size-12 items-center justify-center rounded-[18px] ${
                        tier.accent
                          ? "bg-white/12 text-white"
                          : "bg-[color:var(--pt-cobalt-soft)] text-[color:var(--pt-cobalt)]"
                      }`}
                    >
                      <Icon size={23} strokeWidth={1.8} />
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[13px] font-semibold ${
                        tier.accent
                          ? "bg-white text-[color:var(--pt-ink)]"
                          : "bg-[color:var(--pt-cobalt-soft)] text-[color:var(--pt-cobalt)]"
                      }`}
                    >
                      {tier.price}
                    </span>
                  </div>
                  <h2 className="mt-8 text-[30px] font-semibold leading-[1.05] tracking-[-0.035em]">
                    {tier.title}
                  </h2>
                  <p
                    className={`mt-4 text-[15px] leading-7 ${
                      tier.accent ? "text-white/68" : "text-[color:var(--pt-muted)]"
                    }`}
                  >
                    {tier.body}
                  </p>
                  <div className="mt-auto space-y-3 pt-8">
                    {tier.items.map((item) => (
                      <div
                        key={item}
                        className={`flex min-h-11 items-center gap-3 rounded-[18px] px-4 text-[14px] font-semibold ${
                          tier.accent
                            ? "bg-white/10 text-white"
                            : "bg-[color:var(--pt-bg)] text-[color:var(--pt-ink)]"
                        }`}
                      >
                        <CheckCircle2
                          size={17}
                          strokeWidth={1.8}
                          className={tier.accent ? "text-white" : "text-[color:var(--pt-cobalt)]"}
                        />
                        {item}
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          <section className="mt-12 flex flex-col items-start justify-between gap-8 rounded-[34px] border border-[color:var(--pt-line)] bg-white p-6 shadow-[0_30px_90px_rgba(20,34,55,0.06)] sm:p-9 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-display text-[34px] font-semibold leading-[1.04] tracking-[-0.04em] sm:text-[48px]">
                Не нужно выбирать вслепую
              </h2>
              <p className="mt-4 max-w-[68ch] text-[16px] leading-8 text-[color:var(--pt-muted)]">
                Сначала загрузите материал. PeakTalk покажет, какие результаты можно собрать именно из него.
              </p>
            </div>
            <Link
              href="/simulation/guest"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[color:var(--pt-cobalt)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--pt-cobalt-strong)]"
            >
              Загрузить материал
              <ArrowRight size={16} strokeWidth={1.8} />
            </Link>
          </section>
        </div>
      </section>
    </main>
  );
}
