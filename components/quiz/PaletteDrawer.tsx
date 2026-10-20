"use client";

export type ResultState = 'correct' | 'wrong' | 'skipped' | 'dropped';
export type ReviewFilter = 'ALL' | 'WRONG' | 'SKIPPED' | 'MARKED';

// NTA computer-based test statuses.
export type NtaStatus = 'notVisited' | 'notAnswered' | 'answered' | 'marked' | 'answeredMarked';

const FILTER_LABELS: Record<ReviewFilter, string> = {
  ALL: 'All',
  WRONG: 'Wrong',
  SKIPPED: 'Skipped',
  MARKED: 'Marked',
};

const NTA_STYLE: Record<NtaStatus, { cls: string; label: string }> = {
  notVisited: { cls: 'bg-slate-100 text-slate-700 border border-slate-300 rounded-md', label: 'Not Visited' },
  notAnswered: { cls: 'bg-rose-600 text-white border-transparent rounded-t-xl rounded-b-sm', label: 'Not Answered' },
  answered: { cls: 'bg-emerald-600 text-white border-transparent rounded-b-xl rounded-t-sm', label: 'Answered' },
  marked: { cls: 'bg-violet-700 text-white border-transparent rounded-full', label: 'Marked for Review' },
  answeredMarked: { cls: 'bg-violet-700 text-white border-transparent rounded-full', label: 'Answered & Marked (will be evaluated)' },
};

export function ntaStatus(answered: boolean, marked: boolean, visited: boolean): NtaStatus {
  if (answered && marked) return 'answeredMarked';
  if (marked) return 'marked';
  if (answered) return 'answered';
  if (visited) return 'notAnswered';
  return 'notVisited';
}

export default function PaletteDrawer({
  totalQuestions,
  currentIndex,
  answeredFlags,
  reviewFlags,
  visitedFlags,
  onSelect,
  onClose,
  onSubmit,
  isSubmitted,
  resultStates,
  filter = 'ALL',
  onFilterChange,
}: {
  totalQuestions: number;
  currentIndex: number;
  answeredFlags: boolean[];
  reviewFlags: boolean[];
  // Questions the student has opened. Without it, every unanswered question
  // counts as visited.
  visitedFlags?: boolean[];
  onSelect: (index: number) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitted: boolean;
  // After submitting: per-question outcome, used for colours and the filter.
  resultStates?: ResultState[];
  filter?: ReviewFilter;
  onFilterChange?: (f: ReviewFilter) => void;
}) {
  const showResults = isSubmitted && resultStates && resultStates.length === totalQuestions;
  const statuses = Array.from({ length: totalQuestions }, (_, i) =>
    ntaStatus(Boolean(answeredFlags[i]), Boolean(reviewFlags[i]), visitedFlags ? Boolean(visitedFlags[i]) : true)
  );
  const counts = statuses.reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {} as Record<NtaStatus, number>);

  const visible = (idx: number) => {
    if (!showResults || filter === 'ALL') return true;
    if (filter === 'WRONG') return resultStates![idx] === 'wrong';
    if (filter === 'SKIPPED') return resultStates![idx] === 'skipped';
    return reviewFlags[idx];
  };

  return (
    <div className="flex md:flex flex-col h-full w-full max-w-[290px] absolute right-0 top-0 z-50 md:relative md:w-72 bg-white rounded-l-2xl md:rounded-lg shadow-2xl md:shadow-sm border-l md:border border-slate-300 overflow-hidden shrink-0">
      <div className="bg-slate-800 md:bg-slate-50 p-3 border-b border-slate-700 md:border-slate-200 flex justify-between items-center shrink-0">
        <span className="font-bold text-sm text-white md:text-slate-700 uppercase tracking-wide">Question Palette</span>
        <button onClick={onClose} aria-label="Hide question palette" title="Hide question palette" className="text-white md:text-slate-500 hover:text-amber-400 font-bold px-2 text-xl leading-none">✕</button>
      </div>

      {showResults ? (
        <div className="p-3 border-b border-slate-100 shrink-0 bg-slate-50 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Correct</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-rose-500 rounded-sm"></span> Wrong</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-white border border-slate-300 rounded-sm"></span> Skipped</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-slate-400 rounded-sm"></span> Dropped by NTA</div>
          </div>
          {onFilterChange && (
            <div className="flex gap-1" role="group" aria-label="Show questions">
              {(Object.keys(FILTER_LABELS) as ReviewFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => onFilterChange(f)}
                  aria-pressed={filter === f}
                  className={`flex-1 text-[11px] font-bold py-1 rounded-md border ${filter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <ul className="p-3 border-b border-slate-100 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] shrink-0 bg-slate-50">
          {(Object.keys(NTA_STYLE) as NtaStatus[]).map((s) => (
            <li key={s} className={`flex items-center gap-1.5 ${s === 'answeredMarked' ? 'col-span-2' : ''}`}>
              <span className={`relative w-6 h-6 shrink-0 flex items-center justify-center text-[10px] font-bold ${NTA_STYLE[s].cls}`}>
                {counts[s] || 0}
                {s === 'answeredMarked' && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />}
              </span>
              <span className="text-slate-700">{NTA_STYLE[s].label}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-5 gap-2 content-start bg-slate-50/50">
        {Array.from({ length: totalQuestions }, (_, idx) => {
          if (!visible(idx)) return null;
          let btnColor: string;
          let tick = false;
          if (showResults) {
            const state = resultStates![idx];
            btnColor = 'bg-white text-slate-700 border border-slate-300 rounded-lg';
            if (state === 'correct') btnColor = 'bg-emerald-500 text-white font-bold border-transparent rounded-lg';
            else if (state === 'wrong') btnColor = 'bg-rose-500 text-white font-bold border-transparent rounded-lg';
            else if (state === 'dropped') btnColor = 'bg-slate-400 text-white font-bold border-transparent rounded-lg';
          } else {
            const s = statuses[idx];
            btnColor = `${NTA_STYLE[s].cls} font-bold`;
            tick = s === 'answeredMarked';
          }
          const current = idx === currentIndex ? 'ring-2 ring-indigo-900 ring-offset-2' : '';
          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              aria-current={idx === currentIndex ? 'step' : undefined}
              className={`relative w-9 h-9 text-xs transition flex items-center justify-center ${btnColor} ${current}`}
            >
              {idx + 1}
              {tick && <span aria-hidden className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />}
            </button>
          );
        })}
      </div>

      {!isSubmitted && (
        <div className="p-3 border-t border-slate-200 shrink-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
          <button onClick={onSubmit} className="w-full py-3 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition shadow-md">
            Submit Final Test
          </button>
        </div>
      )}
    </div>
  );
}
