"use client";

import dynamic from 'next/dynamic';
import { formatTime } from '@/lib/scoring';
import type { NormalizedQuestion } from '@/lib/types';

// dompurify (used inside MathText) needs a real browser window, so this is
// loaded client-only — see the comment in MathText.tsx for why.
const MathText = dynamic(() => import('./MathText'), { ssr: false });

export default function QuestionPanel({
  question,
  index,
  total,
  timeSpentSeconds,
  selectedOption,
  onSelect,
  language,
  onToggleLanguage,
  isReviewed,
  onToggleReview,
  onOpenReport,
  onTogglePalette,
  isSubmitted,
  correctOption,
  aiHint,
  onPrev,
  onNext,
  onClear,
  canGoPrev,
  canGoNext,
}: {
  question: NormalizedQuestion;
  index: number;
  total: number;
  timeSpentSeconds: number;
  selectedOption: number | null;
  onSelect: (optIdx: number) => void;
  language: 'EN' | 'HI';
  onToggleLanguage: () => void;
  isReviewed: boolean;
  onToggleReview: () => void;
  onOpenReport: () => void;
  onTogglePalette: () => void;
  isSubmitted: boolean;
  correctOption?: number;
  aiHint?: string | null;
  onPrev: () => void;
  onNext: () => void;
  onClear: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}) {
  const hasHindi = Boolean(question.questionTextHi || question.optionsHi?.some(Boolean));
  const activeText = language === 'HI' && question.questionTextHi ? question.questionTextHi : question.questionText;
  const activeOptions = language === 'HI' && question.optionsHi ? question.optionsHi : question.options;

  return (
    <div className="flex-1 flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden relative">
      <div className="bg-indigo-50 p-2 sm:p-3 border-b border-indigo-100 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-base sm:text-lg font-bold text-indigo-900">Q {index + 1}</span>
          <div className="bg-indigo-100 border border-indigo-300 text-indigo-900 px-2 py-0.5 rounded text-xs font-mono font-bold flex items-center gap-1">
            <span>⏱️</span>
            <span>{formatTime(timeSpentSeconds)}</span>
          </div>
          <span className="hidden sm:inline-block text-[10px] sm:text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md border border-indigo-200 truncate max-w-[150px]">
            {question.unit}
          </span>
          <button onClick={onOpenReport} className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200 font-medium" title="Report Issue">
            🚩 Flag
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {hasHindi && (
            <button onClick={onToggleLanguage} className="bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-extrabold px-2.5 py-1 rounded-md border border-amber-500 shadow-sm transition">
              {language === 'EN' ? 'E / अ' : 'अ / E'}
            </button>
          )}
          <button onClick={onTogglePalette} className="bg-slate-800 text-white px-2.5 py-1 rounded text-sm font-black shadow-sm" title="Toggle Question Palette">
            ☰
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28 bg-slate-50/50">
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 mb-2">Question {index + 1} of {total}</p>
          <MathText html={activeText} className="text-sm sm:text-base md:text-lg font-medium text-slate-900 whitespace-pre-line leading-relaxed" />
        </div>

        <div className="space-y-2.5 sm:space-y-3 mb-6">
          {activeOptions.map((optText, optIdx) => {
            const isSelected = selectedOption === optIdx;
            let borderClass = isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300';
            if (isSubmitted) {
              if (optIdx === correctOption) borderClass = 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold';
              else if (isSelected) borderClass = 'border-rose-600 bg-rose-50 text-rose-900';
            }
            return (
              <div
                key={optIdx}
                onClick={() => !isSubmitted && onSelect(optIdx)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition flex items-center gap-3 bg-white ${borderClass}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 border-slate-400 flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-600 bg-indigo-600' : ''}`}>
                  {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <MathText html={optText} className="text-sm sm:text-base flex-1" />
              </div>
            );
          })}
        </div>

        {isSubmitted && aiHint && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 sm:p-4 rounded-r-lg mt-6 shadow-sm">
            <h4 className="text-xs sm:text-sm font-bold text-amber-900 mb-1">Explanation & AI Hint</h4>
            <p className="text-xs sm:text-sm text-amber-900 whitespace-pre-line leading-relaxed">{aiHint}</p>
          </div>
        )}
      </div>

      {!isSubmitted && (
        <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-200 p-2 sm:p-3 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 shrink-0">
          <button onClick={onPrev} disabled={!canGoPrev} className="px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 text-xs sm:text-sm font-bold rounded-lg transition disabled:opacity-40">
            <span className="hidden sm:inline">« </span>Prev
          </button>
          <div className="flex gap-2">
            <button onClick={onClear} className="hidden sm:block px-2 sm:px-4 py-2 sm:py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 text-xs sm:text-sm font-bold rounded-lg transition">Clear</button>
            <button onClick={onToggleReview} className={`px-3 sm:px-4 py-2 sm:py-2.5 border text-xs sm:text-sm font-bold rounded-lg transition ${isReviewed ? 'bg-amber-400 text-amber-950 border-amber-400' : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200'}`}>
              Review
            </button>
            <button onClick={onNext} disabled={!canGoNext} className="px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs sm:text-sm font-bold rounded-lg transition shadow-md disabled:opacity-40">
              Save &amp; Next <span className="hidden sm:inline"> »</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
