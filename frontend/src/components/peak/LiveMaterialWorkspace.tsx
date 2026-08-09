"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  FileText,
  MessageSquareText,
  Presentation,
  QrCode,
  ShieldQuestion,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

type WorkspaceHomeMode = "empty" | "upload";

type PreparationResult = {
  id: string;
  label: string;
  title: string;
  summary: string;
  preview: string[];
  action: string;
  href: string;
  icon: LucideIcon;
};

type WorkspacePreparation = {
  title: string;
  scenario: string;
  meeting: string;
  nextStep: string;
  href: string;
  actionHref: string;
};

const preparationResults: PreparationResult[] = [
  {
    id: "speech",
    label: "Речь",
    title: "Речь для встречи",
    summary: "Семиминутный вариант без долгого входа, с понятной просьбой в конце.",
    preview: ["Начать с решения", "Показать цену отказа", "Попросить согласовать бюджет"],
    action: "Открыть речь",
    href: "/material/demo?layer=speech",
    icon: MessageSquareText,
  },
  {
    id: "timing",
    label: "Тайминг",
    title: "План по минутам",
    summary: "Где раскрыть тезисы, где оставить паузу и какой блок сократить первым.",
    preview: ["1 минута на контекст", "4 минуты на аргументы", "2 минуты на решение"],
    action: "Открыть план",
    href: "/material/demo?layer=timing",
    icon: Clock3,
  },
  {
    id: "slides",
    label: "Слайды",
    title: "Структура презентации",
    summary: "Порядок слайдов под цель встречи, а не набор одинаковых шаблонов.",
    preview: ["Проблема", "Решение", "Цена риска", "Следующий шаг"],
    action: "Открыть структуру",
    href: "/material/demo?layer=slides",
    icon: Presentation,
  },
  {
    id: "weak-spots",
    label: "Слабые места",
    title: "Слабые места аргументации",
    summary: "Места, где руководитель может не принять обещания, цифры или сроки.",
    preview: ["Не назван владелец риска", "Окупаемость нужно доказать", "Сроки звучат как обещание"],
    action: "Разобрать риски",
    href: "/material/demo?layer=weak-spots",
    icon: TriangleAlert,
  },
  {
    id: "qr-package",
    label: "QR для зала",
    title: "Интерактив для встречи",
    summary: "Короткая механика, если встреча требует вовлечения аудитории.",
    preview: ["Вопрос для голосования", "Текст для экрана", "Инструкция ведущему"],
    action: "Открыть интерактив",
    href: "/material/demo?layer=qr-package",
    icon: QrCode,
  },
  {
    id: "stress-test",
    label: "Проверка",
    title: "Вопросы оппонента",
    summary: "Жесткие вопросы по бюджету, срокам, ответственности и цене ошибки.",
    preview: ["Финансовый директор", "Руководитель продаж", "Комиссия"],
    action: "Начать проверку",
    href: "/material/demo/stress-test",
    icon: ShieldQuestion,
  },
];

const workspacePreparations: WorkspacePreparation[] = [
  {
    title: "Защита плана Q3",
    scenario: "Бюджетная защита",
    meeting: "завтра, 11:00",
    nextStep: "проверить позицию вопросами CFO",
    href: "/material/demo",
    actionHref: "/material/demo/stress-test",
  },
  {
    title: "Сценарий клиента",
    scenario: "Клиентская встреча",
    meeting: "12 июля",
    nextStep: "добавить аудиторию и цель встречи",
    href: "/material/demo?layer=qr-package",
    actionHref: "/workspace?upload=1",
  },
  {
    title: "Позиция перед эскалацией",
    scenario: "Сложный разговор",
    meeting: "без даты",
    nextStep: "разобрать слабые места",
    href: "/material/demo?layer=weak-spots",
    actionHref: "/material/demo?layer=weak-spots",
  },
];

const materialUnderstanding = [
  ["Цель", "согласовать бюджет Q3"],
  ["Кто будет спорить", "CFO и руководитель продаж"],
  ["Слабое место", "окупаемость и сроки"],
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatusBadge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "accent" | "warning" }) {
  return (
    <span
      className={cx(
        "inline-flex min-h-8 items-center rounded-full px-3 text-[12px] font-semibold",
        tone === "accent" && "bg-[color:var(--pt-cobalt-soft)] text-[color:var(--pt-cobalt)]",
        tone === "warning" && "bg-amber-50 text-amber-700",
        tone === "muted" && "bg-[color:var(--pt-bg)] text-[color:var(--pt-muted)]",
      )}
    >
      {children}
    </span>
  );
}

function UploadMaterialPanel({ active }: { active: boolean }) {
  return (
    <section
      className={cx(
        "rounded-[32px] border bg-white p-5 shadow-[0_24px_78px_rgba(23,32,51,0.07)] sm:p-7",
        active ? "border-[color:var(--pt-cobalt)]" : "border-[color:var(--pt-line)]",
      )}
    >
      <div className="max-w-3xl">
        <p className="text-[13px] font-semibold text-[color:var(--pt-cobalt)]">Новый материал</p>
        <h2 className="mt-3 text-[30px] font-semibold leading-tight text-[color:var(--pt-ink)] sm:text-[40px]">
          Загрузите файл. PeakTalk сам спросит только то, чего не хватает.
        </h2>
        <p className="mt-4 max-w-[62ch] text-[15px] leading-7 text-[color:var(--pt-muted)]">
          Не надо выбирать режимы и собирать настройки. Добавьте документ, презентацию или заметки, а дальше сервис доведет подготовку до проверки.
        </p>

        <div className="mt-6 rounded-[24px] border border-dashed border-[color:var(--pt-line-strong)] bg-[color:var(--pt-bg)] p-5">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-white text-[color:var(--pt-cobalt)]">
              <FileText size={23} strokeWidth={1.85} />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold">PDF, презентация, сценарий или обычные заметки</p>
              <p className="mt-2 text-[13px] leading-6 text-[color:var(--pt-muted)]">
                После загрузки появятся 2-3 уточнения: кто слушает, что нужно получить и сколько времени есть.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--pt-cobalt)] px-5 text-sm font-semibold text-white transition hover:bg-[color:var(--pt-cobalt-strong)] active:translate-y-px sm:w-auto"
          >
            Выбрать файл
            <ArrowRight size={15} strokeWidth={1.85} />
          </button>
        </div>
      </div>
    </section>
  );
}

function CurrentPreparationPanel({ current }: { current: WorkspacePreparation }) {
  return (
    <section className="rounded-[32px] border border-[color:var(--pt-line)] bg-white p-5 shadow-[0_24px_78px_rgba(23,32,51,0.07)] sm:p-7">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
        <div>
          <p className="text-[13px] font-semibold text-[color:var(--pt-cobalt)]">Текущая подготовка</p>
          <h2 className="mt-3 max-w-2xl text-[30px] font-semibold leading-tight text-[color:var(--pt-ink)] sm:text-[40px]">
            {current.title}
          </h2>
          <p className="mt-4 max-w-[62ch] text-[15px] leading-7 text-[color:var(--pt-muted)]">
            {current.scenario}. Встреча {current.meeting}. Сейчас главное — {current.nextStep}.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={current.actionHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[color:var(--pt-cobalt)] px-5 text-sm font-semibold text-white transition hover:bg-[color:var(--pt-cobalt-strong)] active:translate-y-px"
            >
              Перейти к проверке
              <ArrowRight size={15} strokeWidth={1.85} />
            </Link>
            <Link
              href="/workspace?upload=1"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--pt-line-strong)] bg-white px-5 text-sm font-semibold text-[color:var(--pt-ink)] transition hover:border-[color:var(--pt-ink)]"
            >
              Добавить другой материал
            </Link>
          </div>
        </div>

        <div className="flex rounded-[28px] bg-[color:var(--pt-ink)] p-5 text-white sm:p-6">
          <div className="flex w-full flex-col">
            <p className="text-[13px] font-semibold text-white/60">Первый вопрос</p>
            <h3 className="mt-4 text-[24px] font-semibold leading-tight">
              Почему бюджет нельзя урезать сейчас, если эффект появится позже?
            </h3>
            <p className="mt-3 text-[14px] leading-7 text-white/64">
              Начните с ответа. После этого PeakTalk покажет, где позиция не выдерживает давления.
            </p>
            <Link
              href={current.actionHref}
              className="mt-auto inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[color:var(--pt-ink)] transition hover:bg-[color:var(--pt-bg)] active:translate-y-px"
            >
              Начать
              <ArrowRight size={15} strokeWidth={1.85} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreparationRow({ item }: { item: WorkspacePreparation }) {
  return (
    <Link
      href={item.href}
      className="group grid gap-3 border-t border-[color:var(--pt-line)] px-1 py-4 transition hover:bg-white md:grid-cols-[minmax(0,1fr)_140px_auto] md:items-center md:px-3"
    >
      <div className="min-w-0">
        <h3 className="text-[16px] font-semibold leading-tight text-[color:var(--pt-ink)]">{item.title}</h3>
        <p className="mt-2 text-[13px] leading-6 text-[color:var(--pt-muted)]">{item.scenario}</p>
      </div>
      <div className="text-[13px] font-semibold text-[color:var(--pt-muted)]">{item.meeting}</div>
      <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[color:var(--pt-cobalt)]">
        Открыть
        <ArrowRight size={14} strokeWidth={1.85} className="transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function WorkspaceHome({ mode = "empty" }: { mode?: WorkspaceHomeMode }) {
  const activePreparation = workspacePreparations[0];
  const isUploadMode = mode === "upload";

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <header className="flex flex-col gap-4 pb-5">
          <div>
            <p className="text-[13px] font-semibold text-[color:var(--pt-cobalt)]">Личный кабинет</p>
            <h1 className="mt-2 font-display text-[34px] font-semibold leading-[1.04] text-[color:var(--pt-ink)] sm:text-[46px]">
              {isUploadMode ? "Добавьте материал без лишних настроек" : "Продолжите подготовку к встрече"}
            </h1>
            <p className="mt-3 max-w-[62ch] text-[15px] leading-7 text-[color:var(--pt-muted)]">
              {isUploadMode
                ? "Начните с файла. Все остальное появится только тогда, когда понадобится для реального разговора."
                : "Откройте текущий материал и проверьте позицию так, как будто встреча уже началась."}
            </p>
          </div>
        </header>

        <div className="grid gap-5">
          {isUploadMode ? (
            <UploadMaterialPanel active />
          ) : (
            <CurrentPreparationPanel current={activePreparation} />
          )}

          <main>
            <section className="rounded-[28px] border border-[color:var(--pt-line)] bg-white p-5 shadow-[0_18px_54px_rgba(23,32,51,0.04)] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[22px] font-semibold text-[color:var(--pt-ink)]">Последние материалы</h2>
                  <p className="mt-2 text-[14px] leading-6 text-[color:var(--pt-muted)]">
                    Здесь только то, к чему можно вернуться.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                {workspacePreparations.map((item) => (
                  <PreparationRow key={item.title} item={item} />
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export function MaterialWorkspace({
  materialId,
}: {
  materialId: string;
  initialLayerId?: string;
}) {
  const materialTitle = materialId === "demo" ? "Защита плана Q3" : "Подготовка по материалу";
  const visibleResults = preparationResults.filter(
    (result) => result.id !== "qr-package" && result.id !== "stress-test",
  );

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <Link href="/workspace" className="inline-flex min-h-9 items-center text-[13px] font-semibold text-[color:var(--pt-cobalt)]">
          К материалам
        </Link>

        <header className="flex flex-col gap-4 pb-5 pt-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[13px] font-semibold text-[color:var(--pt-cobalt)]">Материал</p>
            <h1 className="mt-2 font-display text-[34px] font-semibold leading-[1.04] text-[color:var(--pt-ink)] sm:text-[46px]">
              {materialTitle}
            </h1>
            <p className="mt-3 max-w-[64ch] text-[15px] leading-7 text-[color:var(--pt-muted)]">
              Речь и опорные материалы уже собраны. Сейчас важнее не править все подряд, а проверить, выдержит ли позиция неудобные вопросы.
            </p>
          </div>
        </header>

        <main className="grid gap-5">
          <section className="rounded-[34px] border border-[color:var(--pt-line)] bg-white p-5 shadow-[0_28px_90px_rgba(23,32,51,0.07)] sm:p-7">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
              <div>
                <StatusBadge tone="accent">Готово к проверке</StatusBadge>
                <h2 className="mt-5 max-w-2xl text-[30px] font-semibold leading-tight text-[color:var(--pt-ink)] sm:text-[40px]">
                  Ответьте на вопросы так, как будто встреча уже началась.
                </h2>
                <p className="mt-4 max-w-[62ch] text-[15px] leading-7 text-[color:var(--pt-muted)]">
                  PeakTalk будет давить по бюджету, срокам и ответственности. После ответа вы получите короткий список того, что нужно исправить.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {materialUnderstanding.map(([title, body]) => (
                    <div key={title} className="rounded-[20px] bg-[color:var(--pt-bg)] p-4">
                      <p className="text-[12px] font-semibold text-[color:var(--pt-muted)]">{title}</p>
                      <p className="mt-2 text-[14px] font-semibold leading-6 text-[color:var(--pt-ink)]">{body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex rounded-[28px] bg-[color:var(--pt-ink)] p-5 text-white sm:p-6">
                <div className="flex w-full flex-col">
                  <p className="text-[13px] font-semibold text-white/60">Первый вопрос</p>
                  <h3 className="mt-4 text-[24px] font-semibold leading-tight">
                    Почему бюджет нельзя урезать сейчас, если эффект появится только через два месяца?
                  </h3>
                  <Link
                    href="/material/demo/stress-test"
                    className="mt-auto inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[color:var(--pt-ink)] transition hover:bg-[color:var(--pt-bg)] active:translate-y-px"
                  >
                    Начать проверку
                    <ArrowRight size={15} strokeWidth={1.85} />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[color:var(--pt-line)] bg-white p-5 shadow-[0_18px_54px_rgba(23,32,51,0.04)] sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[22px] font-semibold text-[color:var(--pt-ink)]">Что уже собрано</h2>
                <p className="mt-2 text-[14px] leading-6 text-[color:var(--pt-muted)]">
                  Открывайте только если нужно поправить перед проверкой.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {visibleResults.map((result) => {
                const Icon = result.icon;

                return (
                  <Link
                    key={result.id}
                    href={result.href}
                    className="group grid min-h-[86px] grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] border border-[color:var(--pt-line)] bg-white p-3 transition hover:border-[color:var(--pt-line-strong)] hover:bg-[color:var(--pt-bg)]"
                  >
                    <span className="flex size-11 items-center justify-center rounded-[16px] bg-[color:var(--pt-cobalt-soft)] text-[color:var(--pt-cobalt)]">
                      <Icon size={19} strokeWidth={1.85} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold leading-tight text-[color:var(--pt-ink)]">{result.label}</span>
                      <span className="mt-1 block truncate text-[13px] text-[color:var(--pt-muted)]">{result.summary}</span>
                    </span>
                    <ArrowRight size={15} strokeWidth={1.85} className="text-[color:var(--pt-muted)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--pt-cobalt)]" />
                  </Link>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export function StressTestSurface({ materialId }: { materialId: string }) {
  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1320px] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[34px] border border-[color:var(--pt-line)] bg-white p-5 shadow-[0_28px_90px_rgba(23,32,51,0.07)] sm:p-7">
          <Link href={`/material/${materialId}`} className="text-[13px] font-semibold text-[color:var(--pt-cobalt)]">
            Вернуться к подготовке
          </Link>
          <h1 className="mt-4 max-w-4xl font-display text-[34px] font-semibold leading-[1.03] sm:text-[48px]">
            Краш-тест аргументации
          </h1>
          <p className="mt-4 max-w-[64ch] text-[15px] leading-7 text-[color:var(--pt-muted)]">
            Оппонент задает вопросы по фактам, обещаниям и слабым переходам текущего материала.
          </p>

          <div className="mt-8 rounded-[28px] bg-[color:var(--pt-ink)] p-5 text-white sm:p-7">
            <p className="text-[13px] font-semibold text-white/62">Вопрос оппонента</p>
            <h2 className="mt-4 text-[26px] font-semibold leading-tight sm:text-[34px]">
              Если бюджет урезают, что вы убираете первым и почему ключевой блок нельзя трогать?
            </h2>
          </div>

          <div className="mt-5 rounded-[28px] border border-[color:var(--pt-line)] bg-[color:var(--pt-bg)] p-5">
            <label className="block text-[14px] font-semibold" htmlFor="stress-answer">
              Ответ
            </label>
            <textarea
              id="stress-answer"
              className="mt-3 min-h-40 w-full resize-none rounded-[22px] border border-[color:var(--pt-line)] bg-white p-4 text-[15px] leading-7 outline-none transition focus:border-[color:var(--pt-cobalt)]"
              defaultValue="Сначала я режу второстепенный объем, но оставляю интеграцию, потому что без нее не будет измеримого эффекта для клиента."
            />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[color:var(--pt-cobalt)] px-5 text-sm font-semibold text-white transition hover:bg-[color:var(--pt-cobalt-strong)]"
              >
                Сохранить ответ
                <ArrowRight size={15} strokeWidth={1.85} />
              </button>
              <Link
                href={`/material/${materialId}/stress-test/demo/report`}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--pt-line-strong)] bg-white px-5 text-sm font-semibold text-[color:var(--pt-ink)] transition hover:border-[color:var(--pt-ink)]"
              >
                Открыть отчет
              </Link>
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-4">
          {[
            ["Проверяется", "Цена компромисса, владелец риска и доказательство эффекта."],
            ["Кто давит", "Финансовый директор, который не принимает общие обещания."],
            ["Что дальше", "Памятка обновится после ответа и покажет слабые места."],
          ].map(([title, body]) => (
            <section
              key={title}
              className="rounded-[28px] border border-[color:var(--pt-line)] bg-white p-5 shadow-[0_18px_54px_rgba(23,32,51,0.05)]"
            >
              <h2 className="text-[17px] font-semibold">{title}</h2>
              <p className="mt-3 text-[14px] leading-7 text-[color:var(--pt-muted)]">{body}</p>
            </section>
          ))}
        </aside>
      </div>
    </div>
  );
}

export function StressTestReport({ materialId }: { materialId: string }) {
  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1120px] rounded-[34px] border border-[color:var(--pt-line)] bg-white p-5 shadow-[0_28px_90px_rgba(23,32,51,0.07)] sm:p-7">
        <Link href={`/material/${materialId}`} className="text-[13px] font-semibold text-[color:var(--pt-cobalt)]">
          К подготовке
        </Link>
        <h1 className="mt-4 font-display text-[34px] font-semibold leading-[1.03] sm:text-[48px]">
          План доработок после проверки
        </h1>
        <p className="mt-4 max-w-[64ch] text-[15px] leading-7 text-[color:var(--pt-muted)]">
          Здесь видно, что нужно исправить в речи, слайдах и позиции перед реальной встречей.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Усилить", "Назвать цену отказа и ответственного за риск."],
            ["Сократить", "Убрать длинное объяснение до первого аргумента."],
            ["Проверить", "Добавить метрику, которую нельзя потерять."],
          ].map(([title, body]) => (
            <article
              key={title}
              className="rounded-[26px] border border-[color:var(--pt-line)] bg-[color:var(--pt-bg)] p-5"
            >
              <h2 className="text-[20px] font-semibold">{title}</h2>
              <p className="mt-3 text-[14px] leading-7 text-[color:var(--pt-muted)]">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function BillingSurface() {
  return (
    <UtilitySurface
      title="Оплата и лимиты"
      body="Здесь видно доступ, историю платежей и лимиты. Работа с подготовками остается на отдельном экране."
      primary="Открыть полный доступ"
      secondary="Вернуться к подготовке"
      panels={[
        ["Текущий доступ", "Pro. Полный комплект подготовки и краш-тесты доступны для рабочих материалов."],
        ["Что открывается", "Речь, презентация, интерактив, слабые места и полный цикл проверки."],
      ]}
    />
  );
}

export function SettingsSurface() {
  return (
    <UtilitySurface
      title="Аккаунт и уведомления"
      body="Здесь профиль, уведомления и предпочтения для будущих подготовок."
      primary="Сохранить настройки"
      secondary="Вернуться к подготовке"
      panels={[
        ["Профиль", "Роль, частые сценарии и формат подготовки для будущих материалов."],
        ["Уведомления", "Напоминания о встречах и готовности результатов."],
      ]}
    />
  );
}

function UtilitySurface({
  title,
  body,
  primary,
  secondary,
  panels,
}: {
  title: string;
  body: string;
  primary: string;
  secondary: string;
  panels: Array<[string, string]>;
}) {
  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1180px] rounded-[34px] border border-[color:var(--pt-line)] bg-white p-5 shadow-[0_28px_90px_rgba(23,32,51,0.07)] sm:p-7">
        <h1 className="max-w-3xl font-display text-[34px] font-semibold leading-[1.03] sm:text-[50px]">
          {title}
        </h1>
        <p className="mt-4 max-w-[64ch] text-[15px] leading-7 text-[color:var(--pt-muted)]">
          {body}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[color:var(--pt-cobalt)] px-5 text-sm font-semibold text-white transition hover:bg-[color:var(--pt-cobalt-strong)]"
          >
            {primary}
            <ArrowRight size={15} strokeWidth={1.85} />
          </button>
          <Link
            href="/material/demo"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--pt-line-strong)] bg-white px-5 text-sm font-semibold text-[color:var(--pt-ink)] transition hover:border-[color:var(--pt-ink)]"
          >
            {secondary}
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {panels.map(([panelTitle, panelBody]) => (
            <article
              key={panelTitle}
              className="rounded-[26px] border border-[color:var(--pt-line)] bg-[color:var(--pt-bg)] p-5"
            >
              <h2 className="text-[20px] font-semibold">{panelTitle}</h2>
              <p className="mt-3 text-[14px] leading-7 text-[color:var(--pt-muted)]">
                {panelBody}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
