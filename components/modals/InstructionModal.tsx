"use client";

export default function InstructionModal({
  questionCount,
  durationMinutes,
  onCancel,
  onStart,
}: {
  questionCount: number;
  durationMinutes: number;
  onCancel: () => void;
  onStart: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-200">
        <h3 className="text-xl font-bold text-indigo-900 mb-1">Standard Exam Instructions</h3>
        <p className="text-xs text-slate-500 mb-4">Please read the instructions carefully before commencing the examination.</p>
        <div className="space-y-3 text-xs text-slate-700 mb-6 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p>• <strong>Total Questions:</strong> <span className="font-bold text-indigo-900">{questionCount}</span> Questions</p>
          <p>• <strong>Allocated Duration:</strong> <span className="font-bold text-indigo-900">{durationMinutes} Minutes</span></p>
          <p>• <strong>Auto-Submission:</strong> The master timer counts down at the top header. When it hits zero, your test will automatically submit.</p>
          <p>• <strong>Per-Question Timer:</strong> Displays real-time duration spent on each question to assist time management.</p>
          <p>• <strong>Scoring:</strong> Each correct answer awards <strong>+2 marks</strong>. There is <strong>no negative marking</strong>.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="w-1/2 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition">Cancel</button>
          <button onClick={onStart} className="w-1/2 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition shadow-md">I Am Ready to Begin</button>
        </div>
      </div>
    </div>
  );
}
