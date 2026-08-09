import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/peak/MarketingNav";

type Props = {
  params: Promise<{ slug: string }>;
};

const scenarioData: Record<
  string,
  {
    title: string;
    intro: string;
    checks: string[];
    example: string;
  }
> = {
  "roadmap-budget-defense": {
    title: "Защита плана и бюджета",
    intro: "PeakTalk помогает собрать позицию, объяснить цену решений и подготовиться к вопросам про сроки, деньги и команду.",
    checks: ["Цена компромисса", "Спорные метрики", "Ответственный за решение", "Что можно отложить"],
    example: "Если бюджет режут на треть, что вы убираете первым и какая метрика не должна просесть?",
  },
  "client-escalation": {
    title: "Разговор с недовольным клиентом",
    intro: "PeakTalk помогает объяснить сбой, снять лишнюю резкость и подготовить конкретный следующий шаг.",
    checks: ["Что признаем", "Что исправляем", "Когда будет результат", "Кто отвечает"],
    example: "Что вы готовы изменить уже сейчас, а что не можете обещать без риска сорвать сроки?",
  },
  "qbr-renewal": {
    title: "Квартальный обзор",
    intro: "PeakTalk превращает отчет в короткую позицию: результат периода, доказательства ценности и план следующего шага.",
    checks: ["Ценность периода", "Причины отклонений", "План дальше", "Условия продления"],
    example: "Почему клиент должен продлить работу, если часть целей периода выполнена не полностью?",
  },
  "hr-hard-change": {
    title: "Сложное кадровое объявление",
    intro: "PeakTalk помогает сказать неприятную вещь без канцелярита, пустых обещаний и случайной жесткости.",
    checks: ["Тон речи", "Границы обещаний", "Реакция команды", "Следующий шаг"],
    example: "Какие вопросы команда задаст первыми и где формулировка может усилить тревогу?",
  },
  "investor-pitch": {
    title: "Презентация инвестору",
    intro: "PeakTalk вытаскивает из презентации рынок, рост, деньги, риски и слабые места перед встречей.",
    checks: ["Рынок", "Экономика", "Рост", "Риски"],
    example: "Что доказывает, что рынок достаточно большой, а рост не держится на одном временном факторе?",
  },
  "academic-defense": {
    title: "Защита диплома или исследования",
    intro: "Большой текст превращается в речь, выжимку, шпаргалку и вопросы комиссии по фактуре.",
    checks: ["Логика работы", "Ограничения", "Выводы", "Практическая ценность"],
    example: "Какой главный вывод работы и что в нем можно оспорить?",
  },
};

export default async function ScenarioDetailPage({ params }: Props) {
  const { slug } = await params;
  const scenario = scenarioData[slug] ?? scenarioData["roadmap-budget-defense"];

  return (
    <main className="min-h-[100dvh] bg-[color:var(--pt-bg)] px-4 pb-20 pt-24 text-[color:var(--pt-ink)] sm:px-6 lg:px-8">
      <MarketingNav />
      <div className="mx-auto max-w-[1440px]">
        <header className="border-b border-[color:var(--pt-line)] pb-8">
          <Link href="/scenarios" className="text-[13px] font-semibold text-[color:var(--pt-cobalt)]">
            Все сценарии
          </Link>
          <h1 className="mt-5 max-w-5xl font-display text-[46px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[72px]">
            {scenario.title}
          </h1>
          <p className="mt-6 max-w-[68ch] text-[17px] leading-8 text-[color:var(--pt-muted)]">
            {scenario.intro}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/simulation/guest"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[color:var(--pt-cobalt)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--pt-cobalt-strong)]"
            >
              Загрузить материал
              <ArrowRight size={16} strokeWidth={1.8} />
            </Link>
            <Link
              href="/access"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--pt-line-strong)] bg-white px-6 text-sm font-semibold text-[color:var(--pt-ink)] transition-colors hover:border-[color:var(--pt-ink)]"
            >
              Посмотреть стоимость
            </Link>
          </div>
        </header>

        <section className="mt-10 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <aside className="rounded-[30px] border border-[color:var(--pt-line)] bg-white p-5 shadow-[0_20px_70px_rgba(20,34,55,0.05)]">
            <h2 className="text-base font-semibold">Что проверим</h2>
            <div className="mt-5 space-y-3">
              {scenario.checks.map((item) => (
                <div key={item} className="rounded-[18px] bg-[color:var(--pt-bg)] px-4 py-4 text-sm font-semibold">
                  {item}
                </div>
              ))}
            </div>
          </aside>

          <section className="rounded-[34px] border border-[color:var(--pt-line)] bg-white p-5 shadow-[0_30px_90px_rgba(20,34,55,0.06)] sm:p-8">
            <h2 className="font-display text-[34px] font-semibold leading-[1.04] tracking-[-0.04em] sm:text-[48px]">
              Как пройдет подготовка
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["Исходник", "Вы добавляете тезисы, документ, сценарий или презентацию."],
                ["Уточнения", "PeakTalk спрашивает только то, что влияет на результат."],
                ["Разбор", "PeakTalk показывает слабые места и недостающие факты."],
                ["Проверка", "Оппонент задает вопросы, а памятка обновляется после ответов."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-[24px] border border-[color:var(--pt-line)] bg-[color:var(--pt-bg)] p-5">
                  <h3 className="text-xl font-semibold tracking-[-0.02em]">{title}</h3>
                  <p className="mt-3 text-[14px] leading-7 text-[color:var(--pt-muted)]">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-[30px] bg-[color:var(--pt-ink)] p-5 text-white shadow-[0_26px_90px_rgba(20,34,55,0.15)]">
            <h2 className="text-base font-semibold">Пример вопроса</h2>
            <p className="mt-5 text-[20px] font-semibold leading-7 tracking-[-0.02em]">
              {scenario.example}
            </p>
            <p className="mt-5 text-sm leading-7 text-white/62">
              Хороший ответ называет выбор, риск, ответственного и условие пересмотра.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
