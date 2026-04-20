'use client';

import React, { useState, useCallback } from 'react';
import { Loader2, CheckCircle2, Star } from 'lucide-react';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

type Outcome = 'great' | 'okay' | 'poor' | 'postponed';

interface PostMeetingFeedbackProps {
  session_id: string;
  onComplete: () => void;
}

interface FeedbackPayload {
  outcome: Outcome;
  what_helped: string;
  what_didnt: string;
  rating: number | null;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const OUTCOME_OPTIONS: { value: Outcome; label: string; emoji: string }[] = [
  { value: 'great', label: 'Отлично', emoji: '✦' },
  { value: 'okay', label: 'Нормально', emoji: '—' },
  { value: 'poor', label: 'Плохо', emoji: '△' },
  { value: 'postponed', label: 'Перенеслась', emoji: '◷' },
];

// ── Component ──────────────────────────────────────────────────────────────────

export function PostMeetingFeedback({ session_id, onComplete }: PostMeetingFeedbackProps) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [whatHelped, setWhatHelped] = useState('');
  const [whatDidnt, setWhatDidnt] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayRating = hoveredStar ?? rating;

  const handleSubmit = useCallback(async () => {
    if (!outcome) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload: FeedbackPayload = {
        outcome,
        what_helped: whatHelped.trim(),
        what_didnt: whatDidnt.trim(),
        rating,
      };

      await api.post(`/feedback/${session_id}`, payload);
      setSubmitted(true);
      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить отзыв');
    } finally {
      setSubmitting(false);
    }
  }, [session_id, outcome, whatHelped, whatDidnt, rating, onComplete]);

  // ── Success state ──────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="bg-white border border-neutral-200 p-6 sm:p-8">
        <div className="flex flex-col items-center text-center py-4">
          <CheckCircle2 size={40} className="text-emerald-500 mb-4" />
          <h3 className="font-inter font-bold text-lg text-neutral-900 mb-2">
            Спасибо за обратную связь
          </h3>
          <p className="text-sm text-neutral-500 max-w-sm">
            Это помогает нам улучшить рекомендации и делать симуляции точнее.
          </p>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white border border-neutral-200" id="post-meeting-feedback">
      {/* Header */}
      <div className="bg-neutral-900 text-white p-6 sm:p-8">
        <h2 className="font-inter font-bold text-lg sm:text-xl mb-1">
          Как прошла настоящая встреча?
        </h2>
        <p className="text-neutral-400 text-sm">
          Расскажите, помогла ли симуляция подготовиться
        </p>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* Outcome buttons */}
        <div>
          <label className="font-mono text-[11px] text-neutral-400 uppercase tracking-widest block mb-3">
            Результат встречи
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {OUTCOME_OPTIONS.map((opt) => {
              const isSelected = outcome === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setOutcome(opt.value)}
                  className={`
                    flex flex-col items-center gap-1.5 px-4 py-3 border transition-all cursor-pointer
                    ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
                    }
                  `}
                  type="button"
                >
                  <span className={`text-base ${isSelected ? 'text-accent-400' : 'text-neutral-400'}`}>
                    {opt.emoji}
                  </span>
                  <span className="font-inter font-semibold text-sm">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Star rating */}
        <div>
          <label className="font-mono text-[11px] text-neutral-400 uppercase tracking-widest block mb-3">
            Оценка полезности (необязательно)
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= (displayRating ?? 0);
              return (
                <button
                  key={star}
                  onClick={() => setRating(rating === star ? null : star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(null)}
                  className="p-1 transition-transform hover:scale-110 cursor-pointer"
                  type="button"
                  aria-label={`${star} ${star === 1 ? 'звезда' : 'звезд'}`}
                >
                  <Star
                    size={24}
                    className={`transition-colors ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-none text-neutral-300'
                    }`}
                  />
                </button>
              );
            })}
            {rating && (
              <span className="font-mono text-xs text-neutral-500 ml-2">{rating}/5</span>
            )}
          </div>
        </div>

        {/* Textarea: What helped */}
        <div>
          <label
            htmlFor="what-helped"
            className="font-mono text-[11px] text-neutral-400 uppercase tracking-widest block mb-3"
          >
            Что помогло? (необязательно)
          </label>
          <textarea
            id="what-helped"
            value={whatHelped}
            onChange={(e) => setWhatHelped(e.target.value)}
            placeholder="Например: структурированные аргументы, рекомендации по-anchor фразам..."
            rows={3}
            className="w-full border border-neutral-200 bg-white text-neutral-900 text-sm font-inter leading-relaxed px-4 py-3 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 resize-none"
          />
        </div>

        {/* Textarea: What didn't work */}
        <div>
          <label
            htmlFor="what-didnt"
            className="font-mono text-[11px] text-neutral-400 uppercase tracking-widest block mb-3"
          >
            Что не сработало? (необязательно)
          </label>
          <textarea
            id="what-didnt"
            value={whatDidnt}
            onChange={(e) => setWhatDidnt(e.target.value)}
            placeholder="Например: возражения были другие, не учтён контекст..."
            rows={3}
            className="w-full border border-neutral-200 bg-white text-neutral-900 text-sm font-inter leading-relaxed px-4 py-3 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-rose-600 font-inter bg-rose-50 border border-rose-100 px-4 py-3">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!outcome || submitting}
          className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-black text-white font-inter font-semibold text-sm h-12 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          type="button"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Отправляем...
            </>
          ) : (
            'Отправить обратную связь'
          )}
        </button>
      </div>
    </div>
  );
}
