"use client";

import Link from 'next/link';
import { CORRECT_MARKS, formatTime } from '@/lib/scoring';
import { UNIT_OPTIONS } from '@/lib/normalize';
import type { UnitBreakdown } from '@/lib/types';

const unitOrder = (unit: string) => {
  const i = UNIT_OPTIONS.findIndex((u) => u.value === unit);
  return i === -1 ? 99 : i;
};

export default function ResultModal({
  correctCount,
  totalQuestions,
  droppedCount,
  scorePercentage,
  timeTakenSeconds,
  unitBreakdown,
  saved,
  reviewHref,
  onClose,
}: {
  correctCount: number;
  totalQuestions: number;
  droppedCount: number;
  scorePercentage: number;
  timeTakenSeconds: number;
  unitBreakdown: UnitBreakdown;
  saved: boolean;
  // Deep Review page for this attempt (tag mistakes, save to vault).
  reviewHref?: string;
  onClose: () => void;
}) {
  const units = Object.entries(unitBreakdown || {}).sort(([a], [b]) => unitOrder(a) - unitOrder(b));
  // Message and colour follow the result, so a low score is not celebrated in green.
  const band = scorePercentage >= 60
    ? { icon: '🎉', title: 'Well done!', circle: 'bg-emerald-100', text: 'text-emerald-600' }
    : scorePercentage >= 40
      ? { icon: '👍', title: 'Good effort', circle: 'bg-amber-100', text: 'text-amber-600' }
      : { icon: '💪', title: 'Keep going', circle: 'bg-indigo-100', text: 'text-rose-600' };
  // The two weakest units with questions in them, to say where to start next.
  const weakest = units
    .filter(([, u]) => u.total > 0)
    .map(([unit, u]) => ({ unit, pct: Math.round((u.correct / u.total) * 100) }))
    .filter((u) => u.pct < 60)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 2)
    .map((u) => u.unit);

  return (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="text-center">
          <div className={`w-14 h-14 ${band.circle} rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-3`} aria-hidden>{band.icon}</div>
          <h3 className="text-xl font-bold text-indigo-900 mb-1">{band.title}</h3>
          <p className="text-xs text-slate-500 mb-4">
            Test submitted. {saved ? 'Your score has been saved to My History.' : "Your score couldn't be saved to My History."}
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs mb-4">
          <div className="flex justify-between"><span>Score:</span> <strong className="text-indigo-900 font-bold">{correctCount * CORRECT_MARKS} / {totalQuestions * CORRECT_MARKS} marks ({correctCount}/{totalQuestions} correct)</strong></div>
          <div className="flex justify-between"><span>Percentage:</span> <strong className={`${band.text} font-bold`}>{scorePercentage}%</strong></div>
          <div className="flex justify-between"><span>Time taken:</span> <strong className="text-slate-800">{formatTime(timeTakenSeconds)}</strong></div>
          {droppedCount > 0 && (
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              Includes {droppedCount} question{droppedCount > 1 ? 's' : ''} dropped by NTA, marked correct for everyone.
            </p>
          )}
        </div>

        {weakest.length > 0 && (
          <p className="text-xs text-slate-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            <strong>Start next with:</strong> {weakest.join(' and ')}.
          </p>
        )}

        {units.length > 1 && (
          <div className="mb-5">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Unit-wise score</h4>
            <ul className="space-y-1.5">
              {units.map(([unit, { total, correct }]) => {
                const pct = total ? Math.round((correct / total) * 100) : 0;
                return (
                  <li key={unit} className="text-[11px]">
                    <div className="flex justify-between text-slate-600 mb-0.5">
                      <span className="truncate pr-2">{unit}</span>
                      <span className="font-bold text-slate-800 shrink-0">{correct}/{total}</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 60 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={onClose} className="flex-1 py-3 bg-white border border-indigo-300 text-indigo-700 font-bold rounded-xl text-xs hover:bg-indigo-50 transition">Show answers on this page</button>
          {reviewHref && (
            <Link href={reviewHref} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition shadow-md text-center">
              Review answers and tag mistakes
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
