"use client";

import { formatTime } from '@/lib/scoring';

export default function ResultModal({
  correctCount,
  totalQuestions,
  scorePercentage,
  timeTakenSeconds,
  saveNote,
  onClose,
}: {
  correctCount: number;
  totalQuestions: number;
  scorePercentage: number;
  timeTakenSeconds: number;
  saveNote: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center border border-slate-200">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-3">🎉</div>
        <h3 className="text-xl font-bold text-indigo-900 mb-1">Test Submitted!</h3>
        <p className="text-xs text-slate-500 mb-4">Your performance has been recorded successfully.</p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs mb-2 text-left">
          <div className="flex justify-between"><span>Score Obtained:</span> <strong className="text-indigo-900 font-bold">{correctCount * 2} / {totalQuestions * 2} Marks ({correctCount}/{totalQuestions} Qs)</strong></div>
          <div className="flex justify-between"><span>Percentage:</span> <strong className="text-emerald-600 font-bold">{scorePercentage}%</strong></div>
          <div className="flex justify-between"><span>Time Taken:</span> <strong className="text-slate-800">{formatTime(timeTakenSeconds)}</strong></div>
        </div>
        {saveNote && <p className="text-[11px] text-slate-400 mb-4">{saveNote}</p>}
        <button onClick={onClose} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition shadow-md">Review Question Explanations</button>
      </div>
    </div>
  );
}
