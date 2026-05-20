"use client";

import React, { useEffect, useRef, useState } from 'react';
import { animate, createTimeline, stagger } from 'animejs';
import { useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CircleAlert,
  ClipboardCheck,
  FileText,
  Gauge,
  MessageSquareWarning,
  ShieldAlert,
  Target,
  Timer,
} from 'lucide-react';

type Revertible = {
  revert: () => unknown;
};

type Drill = {
  role: string;
  scenario: string;
  question: string;
  weak: string;
  fix: string;
  pressure: string;
  bars: Array<{ label: string; value: number }>;
};

const drills: Drill[] = [
  {
    role: 'CFO',
    scenario: 'Защита бюджета',
    question: 'Если режем бюджет на 30%, что Вы убираете первым?',
    weak: 'Нет цены компромисса',
    fix: 'Назовите, что можно отложить, риск и метрику, которую нельзя просадить.',
    pressure: 'жёстко',
    bars: [
      { label: 'доказательства', value: 62 },
      { label: 'trade-off', value: 34 },
      { label: 'ответ на риск', value: 52 },
    ],
  },
  {
    role: 'Клиент',
    scenario: 'Эскалация',
    question: 'Почему нам не начать миграцию к другому подрядчику?',
    weak: 'Слишком защитная позиция',
    fix: 'Сначала контроль ситуации, затем владельцы, сроки и конкретная гарантия.',
    pressure: 'высоко',
    bars: [
      { label: 'доверие', value: 48 },
      { label: 'план', value: 71 },
      { label: 'ответственность', value: 43 },
    ],
  },
  {
    role: 'Инвестор',
    scenario: 'Pitch defense',
    question: 'Где доказательство, что рост не куплен скидками?',
    weak: 'Объяснение звучит как optimism bias',
    fix: 'Разведите органический рост, скидки, retention и payback в одну короткую логику.',
    pressure: 'жёстко',
    bars: [
      { label: 'unit-логика', value: 45 },
      { label: 'рынок', value: 66 },
      { label: 'качество роста', value: 39 },
    ],
  },
];

const scenarioCards = [
  {
    tag: 'Бюджет',
    title: 'Защита бюджета',
    conflict: 'CFO режет расходы и просит назвать, что можно убрать.',
    objection: 'Почему эта статья важнее двух инициатив из backlog?',
    metric: 'ROI / payback',
    href: '/scenarios/budget-cut-q3',
  },
  {
    tag: 'Клиент',
    title: 'Эскалация клиента',
    conflict: 'Контракт под риском после сбоя или просадки SLA.',
    objection: 'Какие гарантии, что это не повторится через месяц?',
    metric: 'trust / renewal',
    href: '/scenarios/client-escalation',
  },
  {
    tag: 'Инвестор',
    title: 'Инвест-спич',
    conflict: 'Проверка рынка, роста, CAC, churn и слабых мест команды.',
    objection: 'Почему конкурент не заберёт этот рынок быстрее?',
    metric: 'growth quality',
    href: '/scenarios/series-a-pitch',
  },
  {
    tag: 'Roadmap',
    title: 'Переприоритизация',
    conflict: 'Руководство хочет срочно сдвинуть ключевой релиз.',
    objection: 'Почему команда не может просто взять обе задачи?',
    metric: 'cost of delay',
    href: '/scenarios/roadmap-reprioritization',
  },
];

function useVisible<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    }, { threshold: 0.28 });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function useAnimeFrame(activeKey: string | number, enabled = true) {
  const ref = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion || !enabled) return;

    const introTargets = root.querySelectorAll<HTMLElement>('[data-frame-rise]');
    const meterTargets = root.querySelectorAll<HTMLElement>('[data-frame-meter]');
    const pulseTargets = root.querySelectorAll<HTMLElement>('[data-frame-pulse]');
    const animations: Revertible[] = [];

    if (introTargets.length) {
      const timeline = createTimeline({
        defaults: {
          duration: 560,
          ease: 'out(3)',
        },
      });

      timeline.add(introTargets, {
        opacity: [0, 1],
        y: [14, 0],
      }, stagger(70));

      animations.push(timeline);
    }

    if (meterTargets.length) {
      animations.push(animate(meterTargets, {
        scaleX: [0.36, 1],
        opacity: [0.45, 1],
        transformOrigin: '0% 50%',
        duration: 1500,
        delay: stagger(110),
        ease: 'inOut(2)',
        loop: true,
        alternate: true,
      }));
    }

    if (pulseTargets.length) {
      animations.push(animate(pulseTargets, {
        scale: [0.9, 1.08],
        opacity: [0.42, 1],
        duration: 1200,
        delay: stagger(140),
        ease: 'inOut(2)',
        loop: true,
        alternate: true,
      }));
    }

    return () => {
      animations.forEach((animation) => animation.revert());
    };
  }, [activeKey, enabled, prefersReducedMotion]);

  return ref;
}

function MetricBars({ bars }: { bars: Drill['bars'] }) {
  return (
    <div className="grid gap-3">
      {bars.map((bar) => (
        <div key={bar.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 font-mono text-[10px] uppercase text-neutral-500">
            <span>{bar.label}</span>
            <span className="tabular-nums">{bar.value}%</span>
          </div>
          <div className="h-1.5 overflow-hidden bg-neutral-200">
            <div
              data-frame-meter
              className="h-full origin-left bg-[#E8600A]"
              style={{ width: `${bar.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroLiveFrame() {
  const { ref: visibilityRef, visible } = useVisible<HTMLDivElement>();
  const animeRef = useAnimeFrame('hero', visible);

  return (
    <div
      ref={(node) => {
        visibilityRef.current = node;
        animeRef.current = node;
      }}
      className="hidden max-w-[520px] border border-neutral-200 bg-white/86 p-4 shadow-sm backdrop-blur sm:block"
    >
      <div data-frame-rise className="flex items-center justify-between gap-4">
        <div className="font-mono text-[10px] uppercase text-neutral-500">live pressure frame</div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase text-[#E8600A]">
          <span data-frame-pulse className="size-1.5 bg-[#E8600A]" />
          CFO / QBR
        </div>
      </div>

      <div data-frame-rise className="mt-4 border border-neutral-100 bg-[#faf8f4] p-4">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-bold text-neutral-950">
          <MessageSquareWarning size={16} className="text-[#E8600A]" />
          Уточняющий вопрос
        </div>
        <p className="text-[15px] leading-snug text-neutral-700">
          “Что Вы готовы снять с плана, если бюджет не согласуют полностью?”
        </p>
      </div>

      <div data-frame-rise className="mt-3 grid grid-cols-3 gap-2">
        {['role: CFO', 'pressure: high', 'output: prep-card'].map((item) => (
          <div key={item} className="border border-neutral-100 bg-white px-3 py-2 font-mono text-[10px] uppercase text-neutral-500">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PressureDrillFrame() {
  const [active, setActive] = useState(0);
  const current = drills[active];
  const { ref: visibilityRef, visible } = useVisible<HTMLDivElement>();
  const animeRef = useAnimeFrame(active, visible);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !visible) return;

    const interval = window.setInterval(() => {
      setActive((index) => (index + 1) % drills.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [prefersReducedMotion, visible]);

  return (
    <div
      ref={(node) => {
        visibilityRef.current = node;
        animeRef.current = node;
      }}
      className="overflow-hidden border border-neutral-950 bg-neutral-950 text-white shadow-[0_28px_80px_rgba(17,17,17,0.16)]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
        <div>
          <div className="font-mono text-[10px] uppercase text-white/42">simulation frame</div>
          <div className="mt-1 text-[17px] font-bold text-white">{current.scenario}</div>
        </div>
        <div className="flex items-center gap-2 border border-white/10 px-3 py-2 font-mono text-[10px] uppercase text-[#FF8A3D]">
          <Gauge size={14} />
          {current.pressure}
        </div>
      </div>

      <div className="grid gap-px bg-white/10 lg:grid-cols-[1fr_0.72fr]">
        <div className="bg-neutral-950 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {drills.map((drill, index) => (
              <button
                key={drill.role}
                type="button"
                onClick={() => setActive(index)}
                className={`min-h-9 border px-3 font-mono text-[10px] uppercase transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40 ${
                  active === index
                    ? 'border-[#FF8A3D] bg-[#FF8A3D] text-neutral-950'
                    : 'border-white/12 bg-white/5 text-white/58 hover:border-white/26 hover:text-white'
                }`}
              >
                {drill.role}
              </button>
            ))}
          </div>

          <div data-frame-rise className="border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="font-mono text-[10px] uppercase text-[#FF8A3D]">вопрос оппонента</div>
              <div className="font-mono text-[10px] tabular-nums text-white/34">01 / 03</div>
            </div>
            <p className="text-[22px] font-bold leading-[1.16] text-white text-balance">
              {current.question}
            </p>
          </div>

          <div data-frame-rise className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase text-white/44">
                <CircleAlert size={14} />
                слабое место
              </div>
              <p className="text-[15px] font-semibold leading-snug text-white">{current.weak}</p>
            </div>
            <div className="border border-[#FF8A3D]/35 bg-[#FF8A3D]/10 p-4">
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase text-[#FF8A3D]">
                <ClipboardCheck size={14} />
                prep-card
              </div>
              <p className="text-[15px] leading-snug text-white/76">{current.fix}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#faf8f4] p-5 text-neutral-950 sm:p-6">
          <div data-frame-rise className="mb-5 flex items-center justify-between gap-4">
            <div className="font-mono text-[10px] uppercase text-neutral-500">argument scan</div>
            <BarChart3 size={18} className="text-[#E8600A]" />
          </div>
          <MetricBars bars={current.bars} />
          <div data-frame-rise className="mt-6 border border-neutral-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-[14px] font-bold text-neutral-950">
              <Target size={16} className="text-[#E8600A]" />
              Следующий drill
            </div>
            <p className="text-[14px] leading-relaxed text-neutral-600">
              Защитить один компромисс в 45 секунд без ухода в длинное объяснение.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArtifactPreview() {
  const { ref: visibilityRef, visible } = useVisible<HTMLDivElement>();
  const animeRef = useAnimeFrame('artifact', visible);

  const outputs = [
    { icon: MessageSquareWarning, title: 'Objection map', text: 'Какие вопросы прилетят первыми.' },
    { icon: ShieldAlert, title: 'Weak claims', text: 'Где ответ звучит размыто.' },
    { icon: FileText, title: 'Sharper framing', text: 'Как перестроить аргумент.' },
  ];

  return (
    <div
      ref={(node) => {
        visibilityRef.current = node;
        animeRef.current = node;
      }}
      className="border border-neutral-200 bg-white p-5 shadow-sm lg:p-6"
    >
      <div data-frame-rise className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase text-neutral-500">после сессии</div>
          <div className="mt-1 text-[22px] font-black leading-none text-neutral-950">prep-card</div>
        </div>
        <div className="flex size-10 items-center justify-center bg-neutral-950 text-white">
          <Timer size={18} />
        </div>
      </div>

      <div className="grid gap-3">
        {outputs.map((output) => (
          <div key={output.title} data-frame-rise className="flex gap-3 border border-neutral-100 bg-[#faf8f4] p-4">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center bg-white text-[#E8600A]">
              <output.icon size={16} />
            </div>
            <div>
              <div className="text-[15px] font-bold text-neutral-950">{output.title}</div>
              <p className="mt-1 text-[14px] leading-snug text-neutral-600">{output.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScenarioBrowser() {
  const [active, setActive] = useState(0);
  const current = scenarioCards[active];
  const { ref: visibilityRef, visible } = useVisible<HTMLDivElement>();
  const animeRef = useAnimeFrame(active, visible);

  return (
    <div
      ref={(node) => {
        visibilityRef.current = node;
        animeRef.current = node;
      }}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {scenarioCards.map((scenario, index) => (
          <button
            key={scenario.title}
            type="button"
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
            className={`group min-h-[210px] border p-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40 ${
              active === index
                ? 'border-neutral-950 bg-neutral-950 text-white shadow-lg'
                : 'border-neutral-100 bg-white text-neutral-950 shadow-sm hover:border-neutral-300 hover:shadow-md'
            }`}
          >
            <div className="mb-8 flex items-center justify-between gap-3">
              <div className={`font-mono text-[10px] uppercase ${active === index ? 'text-[#FF8A3D]' : 'text-[#E8600A]'}`}>
                {scenario.tag}
              </div>
              <div className={`font-mono text-[10px] tabular-nums ${active === index ? 'text-white/36' : 'text-neutral-300'}`}>
                0{index + 1}
              </div>
            </div>
            <h3 className="text-[22px] font-bold leading-tight text-balance">{scenario.title}</h3>
            <p className={`mt-3 text-[15px] leading-relaxed text-pretty ${active === index ? 'text-white/62' : 'text-neutral-500'}`}>
              {scenario.conflict}
            </p>
            <div className={`mt-6 inline-flex min-h-8 items-center gap-2 border px-3 font-mono text-[10px] uppercase ${
              active === index ? 'border-white/14 text-white/50' : 'border-neutral-100 text-neutral-400'
            }`}>
              {scenario.metric}
            </div>
          </button>
        ))}
      </div>

      <div className="lg:sticky lg:top-28">
        <div className="border border-neutral-200 bg-[#faf8f4] p-5 shadow-sm">
          <div data-frame-rise className="mb-4 flex items-center justify-between gap-4">
            <div className="font-mono text-[10px] uppercase text-neutral-500">hard objection</div>
            <MessageSquareWarning size={18} className="text-[#E8600A]" />
          </div>
          <p data-frame-rise className="text-[24px] font-bold leading-[1.12] text-neutral-950 text-balance">
            {current.objection}
          </p>
          <div data-frame-rise className="mt-6 border-l-2 border-[#E8600A] bg-white p-4">
            <div className="font-mono text-[10px] uppercase text-neutral-400">проверяется</div>
            <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
              Способность назвать компромисс, риск и критерий решения без длинной защиты.
            </p>
          </div>
          <Link
            href={current.href}
            className="mt-5 inline-flex min-h-11 items-center gap-2 bg-neutral-950 px-5 text-[14px] font-bold text-white transition-colors duration-150 hover:bg-[#E8600A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8600A]/40"
          >
            Разобрать сценарий
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
