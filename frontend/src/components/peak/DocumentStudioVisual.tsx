import {
  ArrowRight,
  FileText,
  ShieldQuestion,
} from "lucide-react";

export function DocumentStudioVisual({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[34px] border border-white/80 bg-white shadow-[0_34px_120px_rgba(20,34,55,0.13)] ${
        compact ? "min-h-[430px]" : "min-h-[520px]"
      }`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#ffffff_0%,#f4f7fb_58%,#edf3ff_100%)]" />

      <div className="relative z-10 flex min-h-[inherit] items-center p-4 sm:p-7">
        <div className="relative mx-auto grid w-full max-w-[780px] gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
          <article className="relative rounded-[30px] border border-[color:var(--pt-line)] bg-white p-5 shadow-[0_28px_90px_rgba(20,34,55,0.12)] sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[16px] bg-[color:var(--pt-cobalt-soft)] text-[color:var(--pt-cobalt)]">
                <FileText size={22} strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[color:var(--pt-muted)]">
                  q3-plan.pdf
                </p>
                <h3 className="mt-1 text-[22px] font-semibold leading-tight text-[color:var(--pt-ink)]">
                  Защита плана Q3
                </h3>
                <p className="mt-2 text-[13px] leading-6 text-[color:var(--pt-muted)]">
                  Нужно согласовать бюджет и не провалиться на вопросах про окупаемость.
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              {[92, 78, 86, 62].map((width, index) => (
                <span
                  key={index}
                  className="block h-2 rounded-full bg-[color:var(--pt-line)]"
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>

            <div className="mt-7 rounded-[22px] bg-[color:var(--pt-bg)] p-4">
              <p className="text-[12px] font-semibold text-[color:var(--pt-muted)]">PeakTalk собрал</p>
              <p className="mt-2 text-[16px] font-semibold leading-6 text-[color:var(--pt-ink)]">
                короткую речь, план по минутам и список слабых мест.
              </p>
            </div>
          </article>

          <section className="rounded-[28px] bg-[color:var(--pt-ink)] p-5 text-white shadow-[0_24px_80px_rgba(20,34,55,0.18)]">
            <span className="flex size-11 items-center justify-center rounded-[16px] bg-white/12 text-white">
              <ShieldQuestion size={22} strokeWidth={1.85} />
            </span>
            <p className="mt-5 text-[12px] font-semibold text-white/60">Первый вопрос</p>
            <h4 className="mt-2 text-[22px] font-semibold leading-tight">
              Почему бюджет нельзя урезать сейчас?
            </h4>
            <p className="mt-3 text-[13px] leading-6 text-white/64">
              Ответ должен держаться на цене задержки, а не на общих обещаниях.
            </p>
            <button
              type="button"
              className="mt-6 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-[12px] font-semibold text-[color:var(--pt-ink)]"
            >
              Проверить ответ
              <ArrowRight size={14} strokeWidth={1.8} />
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
