import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  GraduationCap,
  Layers3,
  MessageSquareText,
  Presentation,
  QrCode,
  ShieldQuestion,
  Users,
} from "lucide-react";
import { DocumentStudioVisual } from "@/components/peak/DocumentStudioVisual";
import { MarketingNav } from "@/components/peak/MarketingNav";

const CTA_LABEL = "Загрузить материал";

const scenarios = [
  "Сценарий мероприятия",
  "Защита идеи",
  "Кадровое объявление",
  "Интервью",
  "Дипломная защита",
  "Инвесторская презентация",
];

const steps = [
  {
    title: "Добавьте материал",
    body: "Документ, сценарий, резюме, презентацию или заметки. Длинное задание писать не нужно.",
    icon: FileText,
  },
  {
    title: "Ответьте на вопросы",
    body: "PeakTalk уточнит аудиторию, ограничения, цель и спорные места материала.",
    icon: MessageSquareText,
  },
  {
    title: "Получите набор",
    body: "Речь, выжимку, тайминг, презентацию, интерактив и вопросы строгого оппонента.",
    icon: Layers3,
  },
];

const outcomes = [
  {
    title: "Для выступления",
    body: "Речь, тайминг и версия под конкретную аудиторию.",
    icon: MessageSquareText,
    items: ["текст", "порядок", "финальный акцент"],
  },
  {
    title: "Для защиты",
    body: "Слабые места, вопросы оппонента и короткая памятка.",
    icon: ShieldQuestion,
    items: ["риски", "контраргументы", "проверка"],
  },
  {
    title: "Для материалов",
    body: "Выжимка, структура презентации и черновик слайдов.",
    icon: Presentation,
    items: ["слайды", "выводы", "экспорт"],
  },
  {
    title: "Для события",
    body: "QR, конкурс, голосование или тестовая механика для зала.",
    icon: QrCode,
    items: ["интерактив", "правила", "запуск"],
  },
];

const audienceCards = [
  {
    title: "Мероприятия",
    body: "Ведущий загружает типовой сценарий. PeakTalk собирает версию под клиента, стиль события и тайминг.",
    icon: CalendarDays,
  },
  {
    title: "Кадры и менеджмент",
    body: "Руководитель готовит сложное объявление без канцелярита, пустых обещаний и случайной жесткости.",
    icon: Users,
  },
  {
    title: "Академия и карьера",
    body: "Диплом, резюме или портфолио превращаются в защитную речь, шпаргалку и вопросы комиссии.",
    icon: GraduationCap,
  },
  {
    title: "Защита идей",
    body: "Позиция превращается в понятные аргументы, список слабых мест и проверку оппонентом.",
    icon: BriefcaseBusiness,
  },
];

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-12 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
        <div className="max-w-[760px]">
          <p className="text-[13px] font-semibold text-[color:var(--pt-cobalt)]">
            Подготовка из ваших материалов
          </p>
          <h1 className="mt-5 font-display text-[42px] font-semibold leading-[1.02] text-[color:var(--pt-ink)] sm:text-[56px] lg:text-[62px]">
            Речь, тайминг и вопросы из вашего материала.
          </h1>
          <p className="mt-6 max-w-[56ch] text-[18px] leading-8 text-[color:var(--pt-muted)]">
            PeakTalk разберет материал и соберет речь, тайминг, презентацию, интерактив и проверку перед встречей.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/simulation/guest"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[color:var(--pt-cobalt)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--pt-cobalt-strong)]"
            >
              {CTA_LABEL}
              <ArrowRight size={16} strokeWidth={1.8} />
            </Link>
            <Link
              href="/scenarios"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--pt-line-strong)] bg-white px-6 text-sm font-semibold text-[color:var(--pt-ink)] transition-colors hover:border-[color:var(--pt-ink)]"
            >
              Выбрать сценарий
            </Link>
          </div>
        </div>

        <DocumentStudioVisual />
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <main className="bg-[color:var(--pt-bg)] text-[color:var(--pt-ink)]">
      <MarketingNav />
      <Hero />

      <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-3xl">
            <h2 className="font-display text-[38px] font-semibold leading-[1.02] sm:text-[56px]">
              Загрузили материал. Получили план подготовки.
            </h2>
            <p className="mt-5 text-[17px] leading-8 text-[color:var(--pt-muted)]">
              PeakTalk сразу работает с вашим файлом и конкретной задачей.
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.title}
                  className="rounded-[28px] border border-[color:var(--pt-line)] bg-white p-6 shadow-[0_20px_70px_rgba(20,34,55,0.05)]"
                >
                  <span className="flex size-11 items-center justify-center rounded-[16px] bg-[color:var(--pt-cobalt-soft)] text-[color:var(--pt-cobalt)]">
                    <Icon size={22} strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-[15px] leading-7 text-[color:var(--pt-muted)]">
                    {step.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="scenarios" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px] rounded-[34px] border border-[color:var(--pt-line)] bg-white p-5 shadow-[0_28px_90px_rgba(20,34,55,0.06)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-3xl font-display text-[34px] font-semibold leading-[1.02] sm:text-[50px]">
              Выберите, к чему готовитесь
            </h2>
            <Link
              href="/scenarios"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--pt-line-strong)] px-5 text-sm font-semibold text-[color:var(--pt-ink)] transition-colors hover:border-[color:var(--pt-ink)]"
            >
              Все сценарии
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <div
                key={scenario}
                className="rounded-[22px] bg-[color:var(--pt-bg)] px-5 py-5 text-[16px] font-semibold text-[color:var(--pt-ink)]"
              >
                {scenario}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="what-you-get" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <h2 className="font-display text-[38px] font-semibold leading-[1.02] sm:text-[56px]">
              Что PeakTalk собирает из одного файла
            </h2>
            <p className="mt-5 text-[16px] leading-8 text-[color:var(--pt-muted)]">
              Не один сгенерированный текст, а рабочий комплект, где каждый результат можно проверить по материалу.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {outcomes.map((outcome, index) => {
              const Icon = outcome.icon;

              return (
                <article
                  key={outcome.title}
                  className={`rounded-[28px] border p-6 shadow-[0_20px_70px_rgba(20,34,55,0.05)] ${
                    index === 0
                      ? "border-[color:var(--pt-cobalt)] bg-[color:var(--pt-cobalt-soft)]"
                      : "border-[color:var(--pt-line)] bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-[16px] bg-white text-[color:var(--pt-cobalt)]">
                      <Icon size={21} strokeWidth={1.8} />
                    </span>
                    <h3 className="text-[25px] font-semibold leading-[1.08]">
                      {outcome.title}
                    </h3>
                  </div>
                  <p className="mt-4 text-[15px] leading-7 text-[color:var(--pt-muted)]">
                    {outcome.body}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {outcome.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[color:var(--pt-line)] bg-white px-3 py-1.5 text-[12px] font-semibold text-[color:var(--pt-muted)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="max-w-4xl">
            <h2 className="font-display text-[38px] font-semibold leading-[1.02] sm:text-[56px]">
              Для разных задач результат разный
            </h2>
            <p className="mt-5 text-[17px] leading-8 text-[color:var(--pt-muted)]">
              Ведущему нужен сценарий. Руководителю нужен спич. Студенту нужна защита. PeakTalk не смешивает эти задачи в одну форму.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {audienceCards.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="group rounded-[30px] border border-[color:var(--pt-line)] bg-white p-6 shadow-[0_20px_70px_rgba(20,34,55,0.05)] transition-colors hover:border-[color:var(--pt-cobalt)]"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-[color:var(--pt-cobalt-soft)] text-[color:var(--pt-cobalt)]">
                      <Icon size={23} strokeWidth={1.8} />
                    </span>
                    <div>
                      <h3 className="text-[26px] font-semibold leading-[1.06]">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-[15px] leading-7 text-[color:var(--pt-muted)]">
                        {item.body}
                      </p>
                      <Link
                        href="/simulation/guest"
                        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[color:var(--pt-bg)] px-5 text-sm font-semibold text-[color:var(--pt-ink)] transition-colors group-hover:bg-[color:var(--pt-cobalt)] group-hover:text-white"
                      >
                        Проверить материал
                        <ArrowRight size={15} strokeWidth={1.8} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-8 rounded-[34px] bg-[color:var(--pt-ink)] p-6 text-white sm:p-9 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <h2 className="font-display text-[34px] font-semibold leading-[1.04] sm:text-[52px]">
              Сначала проверьте материал на своем примере
            </h2>
            <p className="mt-5 text-[16px] leading-8 text-white/68">
              Бесплатный разбор покажет первые слабые места и вопросы. Полный пакет откроет речь, презентацию, интерактив, проверку и план доработок.
            </p>
          </div>
          <Link
            href="/simulation/guest"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[color:var(--pt-ink)] transition-colors hover:bg-[color:var(--pt-bg)]"
          >
            {CTA_LABEL}
            <ArrowRight size={16} strokeWidth={1.8} />
          </Link>
        </div>
      </section>
    </main>
  );
}
