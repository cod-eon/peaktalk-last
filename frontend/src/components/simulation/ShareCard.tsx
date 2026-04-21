import React, { useRef, useState, useEffect } from 'react';
import { Download, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface ShareCardProps {
  score: number;
  personaName: string;
  summary: string;
  metrics: { metric_name: string; score: number }[];
}

export function ShareCard({ score, personaName, summary, metrics }: ShareCardProps) {
  const maxMetrics = metrics.slice(0, 3);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  function getScoreOpacity(s: number): number {
    if (s >= 0.7) return 1;
    if (s >= 0.5) return 0.6;
    return 0.3;
  }

  function getScoreText(s: number): string {
    if (s >= 8) return 'Высокая';
    if (s >= 6) return 'Выше среднего';
    if (s >= 4) return 'Средняя';
    return 'Требует доработки';
  }

  const exportAsImage = async (action: 'download' | 'share') => {
    if (!cardRef.current || isExporting) return;

    setIsExporting(true);
    try {
      if (typeof document !== 'undefined' && 'fonts' in document) {
        await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
      }

      // Dynamically import html2canvas to prevent blocking main thread on page load
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cardRef.current, {
        scale: Math.max(2, window.devicePixelRatio || 1),
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: cardRef.current.scrollWidth,
        windowHeight: cardRef.current.scrollHeight,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );

      if (!blob) throw new Error('Blob is null');

      if (action === 'download') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `peaktalk-score-${score}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (action === 'share') {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'score.png', { type: 'image/png' })] })) {
          const file = new File([blob], 'score.png', { type: 'image/png' });
          await navigator.share({
            files: [file],
            title: 'Мой результат в PeakTalk',
            text: `Я прошел стресс-тест в PeakTalk на ${score}/10! А ты сможешь?`
          });
        } else {
          const text = `Я прошел стресс-тест в PeakTalk на ${score}/10! А ты сможешь? https://peaktalk.ru`;
          await navigator.clipboard.writeText(text);
          toast.success('Текст для шаринга скопирован');
        }
      }
    } catch (err) {
      console.error('share-card export failed', err);
      toast.error('Не удалось экспортировать изображение');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="my-8 flex flex-col items-center w-full">
      <div
        ref={cardRef}
        className="w-full max-w-md rounded-none overflow-hidden border border-neutral-200 bg-white shadow-sm"
        style={{ minHeight: 280 }}
      >
        <div className="px-6 pt-8 pb-6 border-b border-gray-100 bg-gradient-to-b from-neutral-50 to-white relative">
          {/* Subtle watermark/decoration using standard inline SVG for html2canvas compatibility */}
          <div className="absolute top-4 right-4 text-neutral-100 rotate-12 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
              <path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>
            </svg>
          </div>

          <div className="relative z-10">
            <div className="mb-4 border-b border-neutral-200 pb-4">
              <div className="font-inter text-neutral-500 font-medium text-xs mb-1 tracking-widest uppercase flex items-center gap-1">
                PEAKTALK <span className="opacity-50">/</span> СТРЕСС-ТЕСТ
              </div>
              <div className="flex items-baseline gap-2">
                <div className="font-inter font-extrabold text-neutral-900 leading-none" style={{ fontSize: '42px' }}>
                  {score}<span className="text-xl text-neutral-400 font-medium">/10</span>
                </div>
              </div>
              <div className="font-mono text-neutral-500" style={{ fontSize: 13, marginTop: '8px' }}>
                Готовность: {getScoreText(score)}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#E8600A] text-sm">✦</span>
              <p className="text-gray-800 font-semibold text-sm">Противник: {personaName}</p>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-5 italic line-clamp-3">
              «{summary}»
            </p>

            <div className="flex flex-wrap gap-2">
              {maxMetrics.map((m) => {
                 const s10 = Math.round(m.score * 10);
                 return (
                  <span
                    key={m.metric_name}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white shrink-0 font-mono"
                    style={{ backgroundColor: '#E8600A', opacity: getScoreOpacity(m.score) }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 inline-block" />
                    {m.metric_name} {s10}/10
                  </span>
                 );
              })}
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 px-6 py-4 flex justify-between items-center text-white">
          <div className="font-bold text-sm tracking-tight">PeakTalk</div>
          <div className="text-xs text-neutral-400 font-mono">peaktalk.ru</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-6 w-full max-w-md">
        <button
          onClick={() => exportAsImage('download')}
          disabled={isExporting}
          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold px-4 py-3 border border-neutral-200 transition-all font-mono text-sm disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Сохранить PNG
        </button>

        <button
          onClick={() => exportAsImage('share')}
          disabled={isExporting}
          className="flex-1 flex items-center justify-center gap-2 bg-[#E8600A] hover:bg-[#c95207] text-white font-semibold px-4 py-3 transition-colors text-sm disabled:opacity-50 rounded-none"
        >
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
          Поделиться
        </button>
      </div>
    </div>
  );
}
