"use client";

// Full-screen "please wait" with a spinner, so a click on Start never looks ignored.
export default function LoadingScreen({ message = 'Loading test…' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" aria-hidden />
      <p className="text-sm font-semibold text-slate-700">
        {message}
        <span className="inline-block w-6 text-left animate-pulse">…</span>
      </p>
      <p className="text-xs text-slate-400">टेस्ट तैयार हो रहा है, कृपया प्रतीक्षा करें</p>
    </div>
  );
}
