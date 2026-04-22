import React, { useEffect, useState } from 'react';
import { Download, Lock, Loader2, Sparkles, Zap, ShieldAlert, Crosshair, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export interface PrepCardProps {
  sessionId: string;
}

type PrepCardArtifact = {
  opening_move: string;
  top_arguments: { text: string; strength: string; anchor_phrase: string }[];
  danger_zones: { topic: string; risk: string; suggested_response: string }[];
  key_numbers: string[];
};

type PrepCardResponse = {
  available: boolean;
  artifact: PrepCardArtifact | null;
  teaser?: {
    top_arguments_count: number;
    anchor_phrases_preview: string[];
    danger_zones_count: number;
  } | null;
};

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
        if (res.status === 202 || res.status === 404 || res.status === 409) {
          // If the backend returns a specific status indicating it's still processing
          // or if it returns 409 (Conflict - not generated yet) we poll
          if (!mounted) return;
          if (res.status === 409 || res.status === 404) {
             // We'll retry after a delay
             setTimeout(fetchArtifact, 2000);
             return;
          }
        }
        if (!mounted) return;
        setData(res);
        setLoading(false);
      } catch (err: unknown) {
        if (!mounted) return;
        // If it's a 404 or 409 from axios/fetch wrapper
        const status = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'status' in err.response ? (err.response as {status: number}).status : null;
        if (status === 404 || status === 409) {
          setTimeout(fetchArtifact, 2000);
          return;
        }
        setError(err instanceof Error ? err.message : 'Ошибка загрузки артефакта');
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
        <p className="text-sm font-inter">Загружаем шпаргалку...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 p-6 sm:p-8">
        <h3 className="font-bold text-neutral-900 mb-2">Шпаргалка недоступна</h3>
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
            <h3 className="font-bold font-inter text-neutral-900 mb-2">Откройте полную шпаргалку</h3>
            <p className="text-sm text-neutral-500 mb-6">
              Ваш тариф не включает детализированные артефакты. Шпаргалка с сильными аргументами и разбором слабых мест доступна на платных тарифах или за сессию.
            </p>
            <button
              onClick={() => router.push('/billing?plan=per_session')}
              className="w-full bg-[#171717] hover:bg-black text-white font-semibold h-11 text-sm transition-colors mb-2 cursor-pointer"
            >
              Снять ограничения
            </button>
          </div>
        </div>

        <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-neutral-300">
          <Sparkles size={20} />
          Шпаргалка (Prep Card)
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
      <div className="bg-neutral-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold font-inter text-xl sm:text-2xl flex items-center gap-2 mb-1">
            <Sparkles size={24} className="text-accent-400" />
            Индивидуальная шпаргалка
          </h2>
          <p className="text-neutral-400 text-sm">Сформирована на базе вашей симуляции</p>
        </div>
        <button
          onClick={handlePrintPdf}
          className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 text-sm transition-colors cursor-pointer"
        >
          <Download size={16} />
          Скачать PDF
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
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
