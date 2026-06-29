import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Metric = {
  label: string;
  value: number;
  color: string;
  note: string;
};

const metrics: Metric[] = [
  { label: "Логика", value: 76, color: "#111827", note: "цепочка тезисов" },
  { label: "Доказательства", value: 68, color: "#E8600A", note: "цифры и факты" },
  { label: "Контраргументы", value: 82, color: "#8B5CF6", note: "готовность к нажиму" },
  { label: "Давление", value: 91, color: "#0F172A", note: "сложные вопросы" },
  { label: "План ответа", value: 74, color: "#475569", note: "следующий ход" },
];

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const paper = "#FAF8F4";
const ink = "#111827";
const muted = "#73706A";
const line = "#D9D5CC";
const ember = "#E8600A";
const violet = "#8B5CF6";

const chart = {
  left: 170,
  top: 318,
  width: 1270,
  height: 500,
};

const formatScore = (value: number) => `${Math.round(value)}/100`;

export const PeakTalkBars = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = interpolate(frame, [0, 0.8 * fps], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  const titleY = interpolate(frame, [0, 0.8 * fps], [24, 0], {
    ...clamp,
    easing: easeOut,
  });
  const ruleWidth = interpolate(frame, [0.25 * fps, 1.25 * fps], [0, 1], {
    ...clamp,
    easing: easeOut,
  });
  const finalPulse = interpolate(frame, [4.1 * fps, 5.4 * fps], [0, 1], {
    ...clamp,
    easing: easeOut,
  });

  return (
    <AbsoluteFill
      style={{
        background: paper,
        color: ink,
        fontFamily:
          '"IBM Plex Sans", "Inter", "Arial", "Helvetica Neue", sans-serif',
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(17,24,39,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(17,24,39,0.045) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 18,
          height: "100%",
          background: ember,
        }}
      />

      <header
        style={{
          position: "absolute",
          left: 88,
          right: 88,
          top: 72,
          opacity: intro,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${line}`,
            paddingBottom: 30,
          }}
        >
          <div>
            <div
              style={{
                fontFamily:
                  '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
                fontSize: 22,
                letterSpacing: 2.8,
                textTransform: "uppercase",
                color: muted,
                marginBottom: 22,
              }}
            >
              PeakTalk / тестовая диаграмма
            </div>
            <h1
              style={{
                fontSize: 80,
                lineHeight: 0.94,
                letterSpacing: 0,
                margin: 0,
                fontWeight: 800,
                maxWidth: 960,
              }}
            >
              Где позиция выдержит давление
            </h1>
          </div>

          <div
            style={{
              width: 360,
              borderLeft: `1px solid ${line}`,
              paddingLeft: 30,
            }}
          >
            <div
              style={{
                fontFamily:
                  '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
                fontSize: 18,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: ember,
                marginBottom: 14,
              }}
            >
              Сценарий
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.08 }}>
              Защита бюджета перед советом
            </div>
          </div>
        </div>
      </header>

      <svg
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = chart.top + chart.height - (tick / 100) * chart.height;
          return (
            <g key={tick} opacity={intro}>
              <line
                x1={chart.left}
                x2={chart.left + chart.width}
                y1={y}
                y2={y}
                stroke={tick === 0 ? ink : line}
                strokeWidth={tick === 0 ? 2 : 1}
              />
              <text
                x={chart.left - 24}
                y={y + 7}
                textAnchor="end"
                fill={muted}
                fontSize="22"
                fontFamily='"JetBrains Mono", "SFMono-Regular", Consolas, monospace'
              >
                {tick}
              </text>
            </g>
          );
        })}

        <rect
          x={chart.left}
          y={chart.top}
          width={chart.width}
          height={chart.height}
          fill="none"
          stroke={line}
          strokeWidth="1"
          opacity={0.7 * intro}
        />

        {metrics.map((metric, index) => {
          const lane = chart.width / metrics.length;
          const barWidth = 132;
          const x = chart.left + lane * index + (lane - barWidth) / 2;
          const start = 0.75 * fps + index * 7;
          const progress = interpolate(frame, [start, start + 1.15 * fps], [0, 1], {
            ...clamp,
            easing: easeOut,
          });
          const barHeight = chart.height * (metric.value / 100) * progress;
          const y = chart.top + chart.height - barHeight;
          const score = interpolate(frame, [start, start + 1.15 * fps], [0, metric.value], {
            ...clamp,
            easing: easeOut,
          });
          const labelOpacity = interpolate(frame, [start + 14, start + 34], [0, 1], {
            ...clamp,
            easing: easeOut,
          });

          return (
            <g key={metric.label}>
              <rect
                x={x - 12}
                y={chart.top}
                width={barWidth + 24}
                height={chart.height}
                fill={index === 2 ? "rgba(139,92,246,0.05)" : "rgba(255,255,255,0.36)"}
                stroke="rgba(17,24,39,0.06)"
              />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={metric.color}
              />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.min(10, barHeight)}
                fill={index === 1 ? violet : ember}
                opacity={index === 0 || index === 4 ? 0.78 : 1}
              />
              <text
                x={x + barWidth / 2}
                y={y - 24}
                textAnchor="middle"
                fill={metric.color}
                fontSize="30"
                fontWeight="800"
                opacity={labelOpacity}
              >
                {formatScore(score)}
              </text>
              <text
                x={x + barWidth / 2}
                y={chart.top + chart.height + 54}
                textAnchor="middle"
                fill={ink}
                fontSize="27"
                fontWeight="700"
                opacity={labelOpacity}
              >
                {metric.label}
              </text>
              <text
                x={x + barWidth / 2}
                y={chart.top + chart.height + 91}
                textAnchor="middle"
                fill={muted}
                fontSize="19"
                opacity={labelOpacity}
              >
                {metric.note}
              </text>
            </g>
          );
        })}

        <line
          x1={chart.left}
          x2={chart.left + chart.width * ruleWidth}
          y1={chart.top + chart.height - 0.82 * chart.height}
          y2={chart.top + chart.height - 0.82 * chart.height}
          stroke={ember}
          strokeWidth="3"
          strokeDasharray="14 12"
        />
        <text
          x={chart.left + chart.width - 18}
          y={chart.top + chart.height - 0.82 * chart.height - 18}
          textAnchor="end"
          fill={ember}
          fontSize="22"
          fontWeight="700"
          opacity={ruleWidth}
        >
          зона уверенной защиты
        </text>
      </svg>

      <aside
        style={{
          position: "absolute",
          right: 90,
          top: 342,
          width: 315,
          opacity: interpolate(frame, [2.1 * fps, 3 * fps], [0, 1], {
            ...clamp,
            easing: easeOut,
          }),
          transform: `translateX(${interpolate(frame, [2.1 * fps, 3 * fps], [30, 0], {
            ...clamp,
            easing: easeOut,
          })}px)`,
        }}
      >
        <div
          style={{
            fontFamily:
              '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
            fontSize: 18,
            letterSpacing: 2.4,
            textTransform: "uppercase",
            color: muted,
            marginBottom: 18,
          }}
        >
          Risk map
        </div>
        <div
          style={{
            borderTop: `3px solid ${ink}`,
            borderBottom: `1px solid ${line}`,
            padding: "22px 0 26px",
          }}
        >
          <div
            style={{
              fontSize: 66,
              lineHeight: 0.95,
              fontWeight: 850,
              color: ember,
              marginBottom: 12,
            }}
          >
            3
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.16, fontWeight: 700 }}>
            слабых места стоит закрыть до встречи
          </div>
        </div>
        <p
          style={{
            marginTop: 22,
            color: muted,
            fontSize: 24,
            lineHeight: 1.35,
          }}
        >
          Фокус не на красоте речи, а на том, выдержит ли аргументация неудобные
          вопросы.
        </p>
      </aside>

      <footer
        style={{
          position: "absolute",
          left: 88,
          right: 88,
          bottom: 62,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: interpolate(frame, [4.2 * fps, 5 * fps], [0, 1], {
            ...clamp,
            easing: easeOut,
          }),
        }}
      >
        <div
          style={{
            width: 540,
            height: 8,
            background: `linear-gradient(90deg, ${ember} ${Math.round(
              finalPulse * 100,
            )}%, ${line} ${Math.round(finalPulse * 100)}%)`,
          }}
        />
        <div
          style={{
            fontFamily:
              '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
            fontSize: 18,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: muted,
          }}
        >
          тестовый рендер / русская локализация
        </div>
      </footer>
    </AbsoluteFill>
  );
};
