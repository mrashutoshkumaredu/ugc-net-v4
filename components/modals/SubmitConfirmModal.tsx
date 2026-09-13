"use client";

export default function SubmitConfirmModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center border border-slate-200">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-3">⚠️</div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Submit Your Test?</h3>
        <p className="text-xs text-slate-500 mb-6">Are you sure you want to finalize and submit your test? You will not be able to change answers after this.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="w-1/2 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition">Cancel</button>
          <button onClick={onConfirm} className="w-1/2 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition shadow-md">Yes, Submit</button>
        </div>
      </div>
    </div>
  );
}
