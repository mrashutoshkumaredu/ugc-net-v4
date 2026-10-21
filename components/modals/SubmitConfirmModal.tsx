"use client";

export default function SubmitConfirmModal({
  unansweredCount = 0,
  onCancel,
  onConfirm,
}: {
  unansweredCount?: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center border border-slate-200" role="dialog" aria-modal="true" aria-labelledby="submit-title">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-3" aria-hidden>⚠️</div>
        <h3 id="submit-title" className="text-lg font-bold text-slate-800 mb-1">Submit your test?</h3>
        <p className="text-xs text-slate-500 mb-2">You will not be able to change answers after this.</p>
        {unansweredCount > 0 && (
          <p className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg p-2 mb-4">
            {unansweredCount} question{unansweredCount > 1 ? 's are' : ' is'} not answered yet.
          </p>
        )}
        <div className="flex gap-3 mt-4">
          <button onClick={onCancel} className="w-1/2 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition">Cancel</button>
          <button onClick={onConfirm} className="w-1/2 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition shadow-md">Yes, Submit</button>
        </div>
      </div>
    </div>
  );
}
