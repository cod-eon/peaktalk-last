import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  GraduationCap,
  Layers3,
  MessageSquareText,
  UploadCloud,
  Users,
} from "lucide-react";
import { MarketingNav } from "@/components/peak/MarketingNav";

const intents = [
  { label: "Мероприятие", icon: CalendarDays },
  { label: "Кадровое сообщение", icon: Users },
  { label: "Защита идеи", icon: BriefcaseBusiness },
  { label: "Интервью", icon: MessageSquareText },
  { label: "Дипломная защита", icon: GraduationCap },
];

const questions = [
  "Кто будет слушать материал?",
  "Что нельзя уступить?",
  "Какие цифры могут оспорить?",
];

const outputs = [
  "Сильная версия выступления",
  "Короткая выжимка",
  "Тайминг и структура",
  "Проверка оппонентом",
];

function UploadPreview() {
  return (
    <div id="upload" className="relative overflow-hidden rounded-[36px] border border-[color:var(--pt-line)] bg-white p-4 shadow-[0_34px_110px_rgba(20,34,55,0.1)] sm:p-5">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[30px] border border-dashed border-[color:var(--pt-line-strong)] bg-[color:var(--pt-bg)] p-5">
          <div className="flex min-h-[330px] flex-col justify-between">
            <div>
              <span className="flex size-13 items-center justify-center rounded-[20px] bg-white text-[color:var(--pt-cobalt)] shadow-[0_14px_34px_rgba(20,34,55,0.08)]">
                <UploadCloud size={26} strokeWidth={1.8} />
              </span>
              <h2 className="mt-6 font-display text-[34px] font-semibold leading-[1.02] tracking-[-0.04em]">
                Загрузите материал
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-[color:var(--pt-muted)]">
                Текст, презентация, резюме, сценарий или заметки. PeakTalk покажет, что можно собрать дальше.
              </p>
            </div>
            <label className="mt-8 inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[color:var(--pt-ink)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--pt-cobalt)]">
                Выбрать файл
              <ArrowRight size={16} strokeWidth={1.8} />
              <input type="file" className="sr-only" />
            </label>
          </div>
        </section>

        <section className="rounded-[30px] border border-[color:var(--pt-line)] bg-[linear-gradient(135deg,#ffffff_0%,#f7f9fc_100%)] p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(220px,1fr)]">
            <div className="relative min-h-[340px]">
              <div className="absolute left-[45%] top-11 hidden h-[270px] w-[210px] -translate-x-1/2 rotate-[-8deg] rounded-[24px] border border-[color:var(--pt-line)] bg-[color:var(--pt-cobalt-soft)] sm:block" />
              <div className="absolute left-[52%] top-14 hidden h-[270px] w-[210px] -translate-x-1/2 rotate-[6deg] rounded-[24px] border border-[color:var(--pt-line)] bg-white sm:block" />
              <article className="relative z-10 mx-auto flex min-h-[320px] w-full max-w-[245px] flex-col rounded-[26px] border border-[color:var(--pt-line)] bg-white p-4 shadow-[0_26px_72px_rgba(20,34,55,0.13)]">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-[15px] bg-[color:var(--pt-cobalt-soft)] text-[color:var(--pt-cobalt)]">
                    <FileText size={20} strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold text-[color:var(--pt-muted)]">
                      Документ
                    </p>
                    <h3 className="mt-1 text-[16px] font-semibold tracking-[-0.02em]">
                      Сценарий клиента
                    </h3>
                  </div>
                </div>

                <div className="mt-7 space-y-3">
                  {[92, 66, 84, 58, 78].map((width, index) => (
                    <span
                      key={index}
                      className="block h-2 rounded-full bg-[color:var(--pt-line)]"
                      style={{ width: `${width}%` }}
                    />
                  ))}
                </div>

                <div className="mt-auto space-y-2 pt-7">
                  {["Исходник", "Версия под клиента", "Тайминг"].map((item, index) => (
                    <div
                      key={item}
                      className={`flex items-center justify-between rounded-[16px] border px-3 py-3 text-[12px] font-semibold ${
                        index === 1
                          ? "border-[color:var(--pt-cobalt)] bg-[color:var(--pt-cobalt-soft)] text-[color:var(--pt-ink)]"
                          : "border-[color:var(--pt-line)] bg-[color:var(--pt-bg)] text-[color:var(--pt-muted)]"
                      }`}
                    >
                      <span>{item}</span>
                      <span className="font-mono text-[10px]">0{index + 1}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-[24px] border border-[color:var(--pt-line)] bg-white p-4">
                <p className="text-sm font-semibold">PeakTalk предлагает задачу</p>
                <div className="mt-4 grid gap-2">
                  {intents.slice(0, 4).map((intent, index) => {
                    const Icon = intent.icon;

                    return (
                      <div
                        key={intent.label}
                        className={`flex min-h-11 items-center gap-3 rounded-[16px] px-3 text-[13px] font-semibold ${
                          index === 0
                            ? "bg-[color:var(--pt-cobalt)] text-white"
                            : "bg-[color:var(--pt-bg)] text-[color:var(--pt-ink)]"
                        }`}
                      >
                        <Icon size={16} strokeWidth={1.8} />
                        {intent.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[24px] border border-[color:var(--pt-line)] bg-white p-4">
                <p className="text-sm font-semibold">Перед разбором спрашивает</p>
                <div className="mt-4 space-y-2">
                  {questions.map((question) => (
                    <div
                      key={question}
                      className="rounded-[16px] bg-[color:var(--pt-bg)] px-3 py-3 text-[13px] leading-5 text-[color:var(--pt-ink)]"
                    >
                      {question}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function GuestSimulationPage() {
  return (
    <main className="min-h-[100dvh] bg-[color:var(--pt-bg)] pt-16 text-[color:var(--pt-ink)]">
      <MarketingNav />

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-9 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div>
            <p className="text-[13px] font-semibold text-[color:var(--pt-cobalt)]">
              Начните с файла
            </p>
            <h1 className="mt-5 font-display text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[68px]">
              Загрузите материал. Посмотрите, что получится
            </h1>
            <p className="mt-6 max-w-[58ch] text-[18px] leading-8 text-[color:var(--pt-muted)]">
              PeakTalk определит задачу, задаст короткие вопросы и покажет будущие результаты: речь, тайминг, выжимку или проверку.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#upload"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[color:var(--pt-cobalt)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--pt-cobalt-strong)]"
              >
                Выбрать файл
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

          <UploadPreview />
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-4 lg:grid-cols-4">
          {outputs.map((item, index) => (
            <article
              key={item}
              className={`rounded-[28px] border p-6 shadow-[0_20px_70px_rgba(20,34,55,0.05)] ${
                index === 0
                  ? "border-[color:var(--pt-cobalt)] bg-[color:var(--pt-cobalt-soft)]"
                  : "border-[color:var(--pt-line)] bg-white"
              }`}
            >
              <span className="flex size-11 items-center justify-center rounded-[16px] bg-white text-[color:var(--pt-cobalt)] shadow-[0_10px_24px_rgba(20,34,55,0.06)]">
                <Layers3 size={21} strokeWidth={1.8} />
              </span>
              <h2 className="mt-5 text-[23px] font-semibold leading-[1.05] tracking-[-0.03em]">
                {item}
              </h2>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
