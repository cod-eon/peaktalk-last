import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/peak/MarketingNav";

const scenarios = [
  {
    slug: "roadmap-budget-defense",
    title: "Защита плана и бюджета",
    body: "Нужно объяснить, почему план стоит денег, времени и команды.",
    result: "Аргументы, компромиссы, вопросы финансового блока.",
  },
  {
    slug: "client-escalation",
    title: "Разговор с недовольным клиентом",
    body: "Нужно вернуть доверие, объяснить сбой и договориться о следующем шаге.",
    result: "Позиция, тон ответа, список неудобных вопросов.",
  },
  {
    slug: "qbr-renewal",
    title: "Квартальный обзор",
    body: "Нужно показать результат периода и защитить продление работы.",
    result: "Краткая выжимка, доказательства ценности, ответы клиенту.",
  },
  {
    slug: "hr-hard-change",
    title: "Сложное кадровое объявление",
    body: "Нужно сказать неприятную вещь спокойно, точно и без лишних обещаний.",
    result: "Речь руководителя, формулировки, ответы на реакцию команды.",
  },
  {
    slug: "investor-pitch",
    title: "Презентация инвестору",
    body: "Нужно объяснить рынок, рост, деньги и риски без лишней воды.",
    result: "Структура питча, спорные места, проверка вопросами.",
  },
  {
    slug: "academic-defense",
    title: "Защита диплома или исследования",
    body: "Нужно сжать большой материал до понятной защиты и вопросов комиссии.",
    result: "Речь, шпаргалка, выжимка и вопросы по фактуре.",
  },
];

export default function ScenariosPage() {
  return (
    <main className="min-h-[100dvh] bg-[color:var(--pt-bg)] px-4 pb-20 pt-24 text-[color:var(--pt-ink)] sm:px-6 lg:px-8">
      <MarketingNav />
      <div className="mx-auto max-w-[1440px]">
        <header className="border-b border-[color:var(--pt-line)] pb-8">
          <p className="text-[13px] font-semibold text-[color:var(--pt-cobalt)]">
            Сценарии
          </p>
          <h1 className="mt-4 max-w-5xl font-display text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[68px]">
            Выберите ситуацию, к которой готовитесь
          </h1>
          <p className="mt-5 max-w-[64ch] text-[17px] leading-8 text-[color:var(--pt-muted)]">
            Загрузите свой материал внутри сценария. PeakTalk соберет речь, выжимку, тайминг и вопросы под задачу.
          </p>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scenarios.map((scenario) => (
            <Link
              key={scenario.slug}
              href={`/scenarios/${scenario.slug}`}
              className="group flex min-h-[300px] flex-col rounded-[30px] border border-[color:var(--pt-line)] bg-white p-6 shadow-[0_20px_70px_rgba(20,34,55,0.05)] transition-colors hover:border-[color:var(--pt-cobalt)]"
            >
              <h2 className="text-[30px] font-semibold leading-[1.05] tracking-[-0.035em] text-[color:var(--pt-ink)]">
                {scenario.title}
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-[color:var(--pt-muted)]">
                {scenario.body}
              </p>
              <div className="mt-6 rounded-[22px] bg-[color:var(--pt-bg)] p-4 text-[14px] font-semibold leading-6 text-[color:var(--pt-ink)]">
                {scenario.result}
              </div>
              <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-[color:var(--pt-ink)] transition-colors group-hover:text-[color:var(--pt-cobalt)]">
                Открыть
                <ArrowRight size={15} strokeWidth={1.8} />
              </span>
            </Link>
          ))}
        </section>

        <section className="mt-12 flex flex-col items-start justify-between gap-6 rounded-[34px] bg-[color:var(--pt-ink)] p-6 text-white sm:p-8 lg:flex-row lg:items-center">
          <h2 className="max-w-3xl font-display text-[34px] font-semibold leading-[1.04] tracking-[-0.04em] sm:text-[48px]">
            Нет подходящего сценария? Начните с файла.
          </h2>
          <Link
            href="/simulation/guest"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[color:var(--pt-ink)] transition-colors hover:bg-[color:var(--pt-bg)]"
          >
            Загрузить материал
            <ArrowRight size={16} strokeWidth={1.8} />
          </Link>
        </section>
      </div>
    </main>
  );
}
