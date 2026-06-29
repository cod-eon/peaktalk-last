import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, FileDown, Lock, Loader2, Sparkles, Zap, ShieldAlert, Crosshair, MapPin } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import {
  buildDefenseBriefFilename,
  formatDefenseBriefMarkdown,
  type DefenseBriefArtifact,
} from '@/lib/defense-brief-export';
import { useRouter } from 'next/navigation';

export interface PrepCardProps {
  sessionId: string;
}

type PrepCardArtifact = DefenseBriefArtifact;

type PrepCardResponse = {
  available: boolean;
  artifact: PrepCardArtifact | null;
  teaser?: {
    top_arguments_count: number;
    anchor_phrases_preview: string[];
    danger_zones_count: number;
  } | null;
};

export interface DefenseBriefCardProps {
  artifact: PrepCardArtifact;
  sessionId: string;
}

export function DefenseBriefCard({ artifact, sessionId }: DefenseBriefCardProps) {
  const [copied, setCopied] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const hasPressureScanSections = Boolean(
    artifact.evidence_gaps?.length ||
    artifact.pressure_questions?.length ||
    artifact.next_moves?.length,
  );

  const handleCopyMarkdown = async () => {
    setExportError(null);
    try {
      await navigator.clipboard.writeText(formatDefenseBriefMarkdown(artifact));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setExportError('Не удалось скопировать Defense Brief. Скачайте .md файл.');
    }
  };

  const handleDownloadMarkdown = () => {
    setExportError(null);
    const markdown = formatDefenseBriefMarkdown(artifact);
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = buildDefenseBriefFilename(sessionId);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handlePrintPdf = () => {
    const existing = document.getElementById('_prep_print_style');
    if (existing) existing.remove();
    const style = document.createElement('style');
    style.id = '_prep_print_style';
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #prep-card-ui {
            visibility: visible !important;
            display: block !important;
            position: absolute !important;
            left: 0 !important; top: 0 !important; right: 0 !important;
            background: white !important;
            padding: 24px !important;
            z-index: 99999 !important;
            overflow: visible !important;
            min-height: 100vh !important;
        }
        #prep-card-ui * { visibility: visible !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    window.addEventListener('afterprint', () => document.getElementById('_prep_print_style')?.remove(), { once: true });
  };

  return (
    <div className="bg-white border border-neutral-200" id="prep-card-ui">
      <div className="bg-neutral-900 text-white p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold font-inter text-xl sm:text-2xl flex items-center gap-2 mb-1">
            <Sparkles size={24} className="text-accent-400" />
            Defense Brief
          </h2>
          <p className="text-neutral-400 text-sm">Сформирован на базе стресс-теста материала</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-row lg:justify-end">
          <button
            onClick={handleCopyMarkdown}
            className="flex min-h-10 items-center justify-center gap-1.5 border border-white/10 bg-white/10 px-2 py-2 text-[11px] font-medium text-white transition-colors hover:bg-white/20 cursor-pointer sm:gap-2 sm:px-3 sm:text-sm"
          >
            {copied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
          <button
            onClick={handleDownloadMarkdown}
            className="flex min-h-10 items-center justify-center gap-1.5 border border-white/10 bg-white/10 px-2 py-2 text-[11px] font-medium text-white transition-colors hover:bg-white/20 cursor-pointer sm:gap-2 sm:px-3 sm:text-sm"
          >
            <FileDown size={16} />
            Скачать .md
          </button>
          <button
            onClick={handlePrintPdf}
            className="flex min-h-10 items-center justify-center gap-1.5 bg-white text-neutral-950 px-2 py-2 text-[11px] font-semibold transition-colors hover:bg-neutral-100 cursor-pointer sm:gap-2 sm:px-3 sm:text-sm"
          >
            <Download size={16} />
            PDF
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {exportError && (
          <div className="border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {exportError}
          </div>
        )}

        {/* Opening move */}
        {artifact.opening_move && (
          <div className="bg-accent-50 border border-accent-100 p-4">
            <h3 className="text-accent-800 font-bold text-xs tracking-widest uppercase mb-2 flex items-center gap-2">
              <Crosshair size={14} />
              Рекомендуемый старт
            </h3>
            <p className="text-neutral-800 leading-relaxed font-medium text-sm">
              {artifact.opening_move}
            </p>
          </div>
        )}

        {hasPressureScanSections && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {artifact.evidence_gaps && artifact.evidence_gaps.length > 0 && (
              <div className="border border-red-100 bg-red-50/30 p-3">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-700">
                  <ShieldAlert size={14} />
                  Дыры в позиции
                </h3>
                <ul className="space-y-2 text-xs leading-relaxed text-neutral-800">
                  {artifact.evidence_gaps.map((item, index) => (
                    <li key={index} className="border-t border-red-100 pt-2 first:border-t-0 first:pt-0">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {artifact.pressure_questions && artifact.pressure_questions.length > 0 && (
              <div className="border border-amber-100 bg-amber-50/40 p-3">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-800">
                  <Crosshair size={14} />
                  Вопросы оппонента
                </h3>
                <ul className="space-y-2 text-xs leading-relaxed text-neutral-800">
                  {artifact.pressure_questions.map((item, index) => (
                    <li key={index} className="border-t border-amber-100 pt-2 first:border-t-0 first:pt-0">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {artifact.next_moves && artifact.next_moves.length > 0 && (
              <div className="border border-accent-100 bg-accent-50 p-3">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent-800">
                  <Check size={14} />
                  Что поправить
                </h3>
                <ul className="space-y-2 text-xs leading-relaxed text-neutral-800">
                  {artifact.next_moves.map((item, index) => (
                    <li key={index} className="border-t border-accent-100 pt-2 first:border-t-0 first:pt-0">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Top arguments */}
        {artifact.top_arguments && artifact.top_arguments.length > 0 && (
          <div>
            <h3 className="text-neutral-900 font-bold mb-3 flex items-center gap-2 text-sm">
              <Zap size={16} className="text-amber-500" />
              Ключевые тезисы
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {artifact.top_arguments.map((arg, i: number) => (
                <div key={i} className="border border-neutral-200 p-3 bg-neutral-50 flex flex-col h-full">
                  <h4 className="font-bold text-xs text-neutral-900 mb-1">{arg.text}</h4>
                  <p className="text-xs text-neutral-600 mb-2 flex-1">
                    {arg.strength === 'high' ? 'Сильный аргумент, который выдержал давление.' : 'Рабочий аргумент, который стоит усилить формулировкой.'}
                  </p>
                  <div className="bg-amber-100/50 text-amber-900 text-xs px-2 py-1.5 border border-amber-200 font-medium leading-tight">
                    «{arg.anchor_phrase}»
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anchor phrases */}
        {artifact.anchor_phrases && artifact.anchor_phrases.length > 0 && (
          <div>
            <h3 className="text-neutral-900 font-bold mb-3 flex items-center gap-2 text-sm">
              <Copy size={16} className="text-violet-500" />
              Формулировки, которые стоит забрать на встречу
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {artifact.anchor_phrases.map((phrase: string, i: number) => (
                <div key={i} className="border border-violet-100 bg-violet-50/40 px-3 py-2 text-xs font-medium leading-relaxed text-neutral-800">
                  &quot;{phrase}&quot;
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Danger Zones */}
        {artifact.danger_zones && artifact.danger_zones.length > 0 && (
          <div>
            <h3 className="text-neutral-900 font-bold mb-3 flex items-center gap-2 text-sm">
              <ShieldAlert size={16} className="text-red-500" />
              Зоны риска и возражения
            </h3>
            <div className="space-y-2">
              {artifact.danger_zones.map((zone, i: number) => (
                <div key={i} className="border border-red-100 p-3 bg-red-50/30 flex gap-3">
                  <div className="hidden sm:flex shrink-0 w-6 h-6 rounded-full bg-red-100 items-center justify-center text-red-600 font-bold text-xs mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-neutral-900 mb-1">{zone.topic}</h4>
                    <p className="text-xs text-red-800 mb-1.5">{zone.risk}</p>
                    <div className="text-xs text-neutral-700">
                      <span className="font-semibold mr-1">Как отвечать:</span>
                      {zone.suggested_response}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Numbers / Stats */}
        {artifact.key_numbers && artifact.key_numbers.length > 0 && (
          <div>
            <h3 className="text-neutral-900 font-bold mb-3 flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-indigo-500" />
              Цифры, которые нужно запомнить
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {artifact.key_numbers.map((num: string, i: number) => (
                <span key={i} className="inline-flex bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 text-xs font-medium">
                  {num}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PrepCard({ sessionId }: PrepCardProps) {
  const [data, setData] = useState<PrepCardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const fetchArtifact = async () => {
      try {
        const res = await api.get(`/simulation/${sessionId}/artifact`);
        if (!mounted) return;
        setData(res);
        setLoading(false);
      } catch (err: unknown) {
        if (!mounted) return;
        const status = err instanceof ApiError ? err.status : null;
        if (status === 404 || status === 409) {
          setTimeout(fetchArtifact, 2000);
          return;
        }
        setError(err instanceof Error ? err.message : 'Ошибка загрузки Defense Brief');
        setLoading(false);
      }
    };

    fetchArtifact();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="bg-white border border-neutral-200 p-8 flex flex-col items-center justify-center text-neutral-500">
        <Loader2 size={24} className="animate-spin mb-4" />
        <p className="text-sm font-inter">Готовим Defense Brief...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 p-6 sm:p-8">
        <h3 className="font-bold text-neutral-900 mb-2">Defense Brief недоступен</h3>
        <p className="text-sm text-neutral-500">
          Это не отложенная генерация, а битое состояние данных. {error}
        </p>
      </div>
    );
  }

  if (!data) return null;

  // Paywall / Teaser (Free user)
  if (!data.available && data.teaser) {
    return (
      <div className="bg-white border border-neutral-200 p-6 sm:p-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white backdrop-blur-[2px] z-10 flex flex-col items-center justify-center px-4">
          <div className="bg-white border border-neutral-200 shadow-xl p-6 w-full max-w-sm text-center">
            <Lock size={24} className="mx-auto text-neutral-400 mb-4" />
            <h3 className="font-bold font-inter text-neutral-900 mb-2">Откройте полный Defense Brief</h3>
            <p className="text-sm text-neutral-500 mb-6">
              Полный Defense Brief с сильными аргументами и разбором слабых мест доступен в платной сессии.
            </p>
            <button
              onClick={() => router.push('/billing?plan=per_session')}
              className="w-full bg-[#171717] hover:bg-black text-white font-semibold h-11 text-sm transition-colors mb-2 cursor-pointer"
            >
              Получить Defense Brief
            </button>
          </div>
        </div>

        <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-neutral-300">
          <Sparkles size={20} />
          Defense Brief
        </h2>

        <div className="space-y-4 opacity-30 select-none">
          <div className="bg-neutral-50 p-4 border border-neutral-100">
            <h3 className="font-bold mb-2">Сильные аргументы ({data.teaser.top_arguments_count})</h3>
            <div className="h-4 bg-neutral-200 w-3/4 mb-2"></div>
            <div className="h-4 bg-neutral-200 w-1/2"></div>
          </div>
          <div className="bg-neutral-50 p-4 border border-neutral-100">
            <h3 className="font-bold mb-2">Зоны риска ({data.teaser.danger_zones_count})</h3>
            <div className="h-4 bg-neutral-200 w-full mb-2"></div>
            <div className="h-4 bg-neutral-200 w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const { artifact } = data;
  if (!artifact) return null;

  return <DefenseBriefCard artifact={artifact} sessionId={sessionId} />;
}
