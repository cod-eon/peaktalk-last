import React, { useEffect, useState } from 'react';
import { Download, Lock, Loader2, Sparkles, Zap, ShieldAlert, Crosshair, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export interface PrepCardProps {
  sessionId: string;
}

export function PrepCard({ sessionId }: PrepCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let timeout: NodeJS.Timeout;

    const fetchArtifact = async () => {
      try {
        const res = await api.get(`/simulation/${sessionId}/artifact`);
        if (!mounted) return;

        if (res.generating) {
          // Poll every 3 seconds if still generating
          timeout = setTimeout(fetchArtifact, 3000);
        } else {
          setData(res);
          setLoading(false);
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Ошибка загрузки артефакта');
        setLoading(false);
      }
    };

    fetchArtifact();
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="bg-white border border-neutral-200 p-8 flex flex-col items-center justify-center text-neutral-500">
        <Loader2 size={24} className="animate-spin mb-4" />
        <p className="text-sm font-inter">Формируем шпаргалку...</p>
      </div>
    );
  }

  if (error) {
    return null; // Don't show if there's a hard error
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
        #prep-card-ui { visibility: visible !important; display: block !important; position: fixed !important; inset: 0 !important; background: white !important; padding: 24px !important; z-index: 99999 !important; overflow: visible !important; }
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

      <div className="p-6 sm:p-8 space-y-8">
        {/* Opening move */}
        {artifact.opening_move && (
          <div className="bg-accent-50 border border-accent-100 p-5">
            <h3 className="text-accent-800 font-bold text-sm tracking-widest uppercase mb-3 flex items-center gap-2">
              <Crosshair size={16} />
              Рекомендуемый старт
            </h3>
            <p className="text-neutral-800 leading-relaxed font-medium">
              {artifact.opening_move}
            </p>
          </div>
        )}

        {/* Top arguments */}
        {artifact.top_arguments && artifact.top_arguments.length > 0 && (
          <div>
            <h3 className="text-neutral-900 font-bold mb-4 flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              Ключевые тезисы
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {artifact.top_arguments.map((arg: any, i: number) => (
                <div key={i} className="border border-neutral-200 p-4 bg-neutral-50 flex flex-col h-full">
                  <h4 className="font-bold text-sm text-neutral-900 mb-2">{arg.topic}</h4>
                  <p className="text-sm text-neutral-600 mb-3 flex-1">{arg.rationale}</p>
                  <div className="bg-amber-100/50 text-amber-900 text-xs px-3 py-2 border border-amber-200 font-medium">
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
            <h3 className="text-neutral-900 font-bold mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-red-500" />
              Зоны риска и возражения
            </h3>
            <div className="space-y-3">
              {artifact.danger_zones.map((zone: any, i: number) => (
                <div key={i} className="border border-red-100 p-4 bg-red-50/30 flex gap-4">
                  <div className="hidden sm:flex shrink-0 w-8 h-8 rounded-full bg-red-100 items-center justify-center text-red-600 font-bold text-xs mt-1">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-neutral-900 mb-1">{zone.topic}</h4>
                    <p className="text-sm text-red-800 mb-2">{zone.risk}</p>
                    <div className="text-sm text-neutral-700">
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
            <h3 className="text-neutral-900 font-bold mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-indigo-500" />
              Цифры, которые нужно запомнить
            </h3>
            <div className="flex flex-wrap gap-2">
              {artifact.key_numbers.map((num: string, i: number) => (
                <span key={i} className="inline-flex bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 text-sm font-medium">
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