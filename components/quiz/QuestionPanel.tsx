"use client";

import dynamic from 'next/dynamic';
import { formatTime } from '@/lib/scoring';
import { getPaperDisplayName } from '@/lib/normalize';
import type { NormalizedQuestion } from '@/lib/types';
import HindiImage from './HindiImage';

// dompurify (used inside MathText) needs a real browser window, so this is
// loaded client-only — see the comment in MathText.tsx for why.
const MathText = dynamic(() => import('./MathText'), { ssr: false });

const OPTION_LETTERS = ['1', '2', '3', '4'];

export type TextSize = 'sm' | 'md' | 'lg';
const TEXT_SIZES: { value: TextSize; label: string; title: string }[] = [
  { value: 'sm', label: 'A-', title: 'Smaller text' },
  { value: 'md', label: 'A', title: 'Normal text' },
  { value: 'lg', label: 'A+', title: 'Larger text' },
];

export default function QuestionPanel({
  question,
  index,
  total,
  showSource,
  timeSpentSeconds,
  selectedOption,
  onSelect,
  language,
  onToggleLanguage,
  isReviewed,
  onToggleReview,
  onMarkAndNext,
  onSubmitRequest,
  confidence,
  onToggleConfidence,
  onOpenReport,
  onTogglePalette,
  paletteVisible,
  textSize,
  onTextSize,
  canFullscreen,
  isFullscreen,
  onToggleFullscreen,
  isSubmitted,
  correctOption,
  aiHint,
  onPrev,
  onNext,
  onClear,
  canGoPrev,
  canGoNext,
  hindiImage,
}: {
  question: NormalizedQuestion;
  // Picture of the Hindi question (original NTA image), when there is no typed Hindi text.
  hindiImage?: string;
  index: number;
  total: number;
  // Unit practice mixes papers, so show where each question comes from.
  showSource: boolean;
  timeSpentSeconds: number;
  selectedOption: number | null;
  onSelect: (optIdx: number) => void;
  language: 'EN' | 'HI';
  onToggleLanguage: () => void;
  isReviewed: boolean;
  onToggleReview: () => void;
  // NTA "Mark for Review & Next".
  onMarkAndNext: () => void;
  // On the last question "Save & Next" becomes "Save & Submit" and opens
  // the submit confirmation.
  onSubmitRequest: () => void;
  confidence: 'sure' | 'guess' | null;
  onToggleConfidence: () => void;
  onOpenReport: () => void;
  onTogglePalette: () => void;
  paletteVisible: boolean;
  textSize: TextSize;
  onTextSize: (size: TextSize) => void;
  canFullscreen: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isSubmitted: boolean;
  correctOption?: number;
  aiHint?: string | null;
  onPrev: () => void;
  onNext: () => void;
  onClear: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}) {
  const hasHindiText = Boolean(question.questionTextHi || question.optionsHi?.some(Boolean));
  const hasHindi = hasHindiText || Boolean(hindiImage);
  // Typed Hindi text wins; otherwise show the original NTA picture of the Hindi question.
  const showHindiImage = language === 'HI' && !hasHindiText && Boolean(hindiImage);
  const activeText = language === 'HI' && question.questionTextHi ? question.questionTextHi : question.questionText;
  const activeOptions = showHindiImage
    ? question.options.map((_, i) => `विकल्प ${i + 1}`)
    : language === 'HI' && question.optionsHi ? question.optionsHi : question.options;

  return (
    <div className="flex-1 flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden relative">
      <div className="bg-indigo-50 p-2 sm:p-3 border-b border-indigo-100 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-base sm:text-lg font-bold text-indigo-900">Q {index + 1}</span>
          {!isSubmitted && (
            <div className="bg-indigo-100 border border-indigo-300 text-indigo-900 px-2 py-0.5 rounded text-xs font-mono font-bold flex items-center gap-1" title="Time on this question">
              <span aria-hidden>⏱️</span>
              <span>{formatTime(timeSpentSeconds)}</span>
            </div>
          )}
          <span className="hidden sm:inline-block text-[10px] sm:text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md border border-indigo-200 truncate max-w-[180px]">
            {question.unit}
          </span>
          <button onClick={onOpenReport} className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200 font-medium shrink-0" title="Report an issue with this question">
            🚩 Flag
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {hasHindi && (
            <button onClick={onToggleLanguage} className="bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-extrabold px-2.5 py-1 rounded-md border border-amber-500 shadow-sm transition" title="Switch language">
              {language === 'EN' ? 'E / अ' : 'अ / E'}
            </button>
          )}
          <div className="flex rounded-md border border-indigo-200 bg-white overflow-hidden" role="group" aria-label="Text size">
            {TEXT_SIZES.map((t) => (
              <button
                key={t.value}
                onClick={() => onTextSize(t.value)}
                title={t.title}
                aria-pressed={textSize === t.value}
                className={`px-1.5 sm:px-2 py-1 text-[11px] font-bold leading-none ${textSize === t.value ? 'bg-indigo-600 text-white' : 'text-indigo-800 hover:bg-indigo-50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {canFullscreen && (
            <button
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit full screen' : 'Full screen'}
              aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
              className="bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-md text-sm font-bold leading-none"
            >
              {isFullscreen ? '⤡' : '⤢'}
            </button>
          )}
          <button
            onClick={onTogglePalette}
            className="bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1 rounded text-sm font-black shadow-sm"
            title={paletteVisible ? 'Hide question palette' : 'Show question palette'}
            aria-label={paletteVisible ? 'Hide question palette' : 'Show question palette'}
            aria-pressed={paletteVisible}
          >
            ☰
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28 bg-slate-50/50" data-text-size={textSize}>
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 mb-2">
            Question {index + 1} of {total}
            {showSource && (
              <span className="font-medium"> · {getPaperDisplayName(question.paperId)}{question.questionNumber ? `, Q${question.questionNumber}` : ''}</span>
            )}
          </p>
          {question.isDropped && (
            <p className="mb-3 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg p-2.5">
              {language === 'HI'
                ? 'यह प्रश्न NTA द्वारा आधिकारिक उत्तर कुंजी में हटा दिया गया था।'
                : 'This question was dropped by NTA in the official answer key.'}
            </p>
          )}
          {language === 'HI' && hasHindiText && question.isTranslatedHi && (
            <p
              className="mb-3 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-300 rounded-lg p-2.5"
              title="इस प्रश्न का हिंदी संस्करण मूल प्रश्न पत्र में नहीं था। इसे सत्यापित अंग्रेज़ी संस्करण से अनुवादित किया गया है। (The official paper had no Hindi for this question. It was translated from the checked English version.)"
            >
              ⚠️ हमारे द्वारा अनूदित — मूल प्रश्न पत्र में हिंदी उपलब्ध नहीं थी। (Translated by us — Hindi was missing in the original question paper.)
            </p>
          )}
          {showHindiImage ? (
            <HindiImage key={hindiImage} src={hindiImage!} alt={`प्रश्न ${index + 1} (हिंदी)`} textSize={textSize} />
          ) : (
            <MathText html={activeText} className="q-text font-medium text-slate-900 whitespace-pre-line leading-relaxed" />
          )}
        </div>

        <div className="space-y-2.5 sm:space-y-3 mb-6" role="radiogroup" aria-label="Answer options">
          {activeOptions.map((optText, optIdx) => {
            const isSelected = selectedOption === optIdx;
            let borderClass = isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white';
            if (isSubmitted && correctOption !== undefined && correctOption !== null && correctOption >= 0) {
              if (optIdx === correctOption) borderClass = 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold';
              else if (isSelected) borderClass = 'border-rose-600 bg-rose-50 text-rose-900';
            }
            return (
              // A div with radio semantics rather than a <button>: option text
              // can contain block HTML (tables), which isn't valid inside a button.
              <div
                role="radio"
                aria-checked={isSelected}
                aria-disabled={isSubmitted}
                tabIndex={isSubmitted ? -1 : 0}
                key={optIdx}
                onClick={() => !isSubmitted && onSelect(optIdx)}
                onKeyDown={(e) => {
                  if (!isSubmitted && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(optIdx);
                  }
                }}
                className={`w-full text-left p-4 border-2 rounded-lg transition flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isSubmitted ? '' : 'cursor-pointer'} ${borderClass}`}
              >
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-[11px] font-bold ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400 text-slate-500'}`}>
                  {OPTION_LETTERS[optIdx]}
                </span>
                <MathText html={optText} className="q-option flex-1" />
              </div>
            );
          })}
        </div>

        {!isSubmitted && selectedOption !== null && (
          <div className="mb-6 -mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggleConfidence}
              aria-pressed={confidence === 'guess'}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${confidence === 'guess' ? 'bg-amber-100 text-amber-900 border-amber-400' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
              title="Mark this answer as a guess. If it turns out right, it goes to your Lucky guesses folder for revision."
            >
              {confidence === 'guess' ? '🤔 I am guessing' : '✅ I am sure'}
            </button>
            <span className="text-[11px] text-slate-400">Tap if you&apos;re guessing, so lucky guesses come back for revision.</span>
          </div>
        )}

        {isSubmitted && aiHint && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 sm:p-4 rounded-r-lg mt-6 shadow-sm">
            <h4 className="text-xs sm:text-sm font-bold text-amber-900 mb-1">Explanation</h4>
            <p className="q-hint text-amber-900 whitespace-pre-line leading-relaxed">{aiHint}</p>
          </div>
        )}

        {!isSubmitted && (
          <p className="hidden md:block text-[11px] text-slate-400 mt-4">
            Keyboard: 1–4 choose an option · ← → move · M mark for review · G guessing · Backspace clear
          </p>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-200 p-2 sm:p-3 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <button onClick={onPrev} disabled={!canGoPrev} className="px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 text-xs sm:text-sm font-bold rounded-lg transition disabled:opacity-40">
          <span className="hidden sm:inline">« </span>Back
        </button>
        {isSubmitted ? (
          <button onClick={onNext} disabled={!canGoNext} className="px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs sm:text-sm font-bold rounded-lg transition shadow-md disabled:opacity-40">
            Next<span className="hidden sm:inline"> »</span>
          </button>
        ) : (
          <div className="flex gap-1.5 sm:gap-2">
            <button onClick={onClear} className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 text-xs sm:text-sm font-bold rounded-lg transition">
              Clear<span className="hidden lg:inline"> Response</span>
            </button>
            <button onClick={onMarkAndNext} aria-pressed={isReviewed} className={`px-2.5 sm:px-4 py-2 sm:py-2.5 border text-xs sm:text-sm font-bold rounded-lg transition ${isReviewed ? 'bg-violet-700 text-white border-violet-700' : 'bg-violet-100 text-violet-900 hover:bg-violet-200 border-violet-200'}`}>
              Mark<span className="hidden sm:inline"> for Review</span>{canGoNext ? <> &amp; Next</> : null}
            </button>
            {canGoNext ? (
              <button onClick={onNext} className="px-3 sm:px-6 py-2 sm:py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs sm:text-sm font-bold rounded-lg transition shadow-md">
                Save &amp; Next
              </button>
            ) : (
              <button onClick={onSubmitRequest} className="px-3 sm:px-6 py-2 sm:py-2.5 bg-indigo-700 text-white hover:bg-indigo-800 text-xs sm:text-sm font-bold rounded-lg transition shadow-md">
                Save &amp; Submit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
