"use client";

export default function PaletteDrawer({
  totalQuestions,
  currentIndex,
  answeredFlags,
  reviewFlags,
  onSelect,
  onClose,
  onSubmit,
  isSubmitted,
}: {
  totalQuestions: number;
  currentIndex: number;
  answeredFlags: boolean[];
  reviewFlags: boolean[];
  onSelect: (index: number) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitted: boolean;
}) {
  return (
    <div className="flex md:flex flex-col h-full w-full max-w-[280px] absolute right-0 top-0 z-50 md:relative md:w-72 bg-white rounded-l-2xl md:rounded-lg shadow-2xl md:shadow-sm border-l md:border border-slate-300 overflow-hidden shrink-0">
      <div className="bg-slate-800 md:bg-slate-50 p-3 border-b border-slate-700 md:border-slate-200 flex justify-between items-center shrink-0">
        <span className="font-bold text-sm text-white md:text-slate-700 uppercase tracking-wide">Question Palette</span>
        <button onClick={onClose} className="text-white md:text-slate-500 hover:text-amber-400 font-bold px-2 text-xl leading-none" title="Close Palette">✕</button>
      </div>

      <div className="p-3 border-b border-slate-100 grid grid-cols-2 gap-2 text-[10px] sm:text-xs shrink-0 bg-slate-50">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Answered</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-white border border-slate-300 rounded-sm"></span> Not Visited</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-400 rounded-sm"></span> Review</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-indigo-600 rounded-sm"></span> Current</div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-5 gap-2 content-start bg-slate-50/50">
        {Array.from({ length: totalQuestions }, (_, idx) => {
          let btnColor = 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300';
          if (idx === currentIndex) {
            btnColor = 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-900 ring-offset-1';
          } else if (reviewFlags[idx]) {
            btnColor = 'bg-amber-400 text-amber-950 font-bold border-transparent';
          } else if (answeredFlags[idx]) {
            btnColor = 'bg-emerald-500 text-white font-bold border-transparent';
          }
          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`w-9 h-9 text-xs rounded-lg transition flex items-center justify-center ${btnColor}`}
            >
              {idx + 1}
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
