'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { OPEN_GUIDE_EVENT, WELCOME_AUTO_PATHS, hasSeenWelcome, markWelcomeSeen } from '@/lib/welcome';

const SECTIONS = [
  { icon: '🏠', name: 'Today', text: 'Your starting point: resume a test, see what to revise and count down to your exam.' },
  { icon: '📝', name: 'Practice', text: 'Full previous year papers with a real 60-minute timer, unit-wise sets, daily practice and Speed Math.' },
  { icon: '📘', name: 'Learn', text: 'Maths course, revision notes and previous year question trends by unit.' },
  { icon: '📊', name: 'Progress', text: 'Your scores, weak areas, saved questions (Revision Vault) and the leaderboard.' },
  { icon: '👥', name: 'Class', text: 'Appears when a teacher adds you to a class, with tasks to attempt.' },
];

const TIPS = [
  'Log in or register to start a test and keep your scores.',
  'On a phone, use the tabs at the bottom. On a computer, use the bar at the top.',
  'Closed the page during a test? Open Today to resume. The timer keeps running, as in the real exam.',
  'Papers marked "English + हिंदी" can be switched to Hindi during the test.',
  'Spotted a wrong answer or a typo? Use the Report flag on that question.',
];

// Shown once to first-time visitors, and again whenever "How to use this site" is clicked.
export default function WelcomeGuide() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pathname && WELCOME_AUTO_PATHS.includes(pathname) && !hasSeenWelcome()) setOpen(true);
  }, [pathname]);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_GUIDE_EVENT, show);
    return () => window.removeEventListener(OPEN_GUIDE_EVENT, show);
  }, []);

  const close = useCallback(() => { markWelcomeSeen(); setOpen(false); }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-3 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="welcome-title" className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <h2 id="welcome-title" className="text-lg font-extrabold text-indigo-950">Welcome to UGC NET Paper 1 Portal</h2>
        <p className="mt-0.5 text-xs text-slate-500">A 30-second guide to finding your way around.</p>

        <ul className="mt-4 space-y-2.5">
          {SECTIONS.map((s) => (
            <li key={s.name} className="flex gap-3 rounded-xl bg-slate-50 p-3">
              <span className="text-xl leading-none" aria-hidden>{s.icon}</span>
              <p className="text-xs leading-relaxed text-slate-600"><span className="font-bold text-slate-800">{s.name}.</span> {s.text}</p>
            </li>
          ))}
        </ul>

        <h3 className="mt-5 text-xs font-extrabold uppercase tracking-wide text-slate-500">Good to know</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-slate-600">
          {TIPS.map((t) => <li key={t}>{t}</li>)}
        </ul>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">Find this again under &ldquo;How to use this site&rdquo; at the bottom of any page.</p>
          <button ref={closeRef} onClick={close} className="shrink-0 rounded-lg bg-indigo-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-800">Got it</button>
        </div>
      </div>
    </div>
  );
}
