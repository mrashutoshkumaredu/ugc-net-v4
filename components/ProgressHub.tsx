"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import HubTiles from '@/components/HubTiles';
import HistoryDrawer from '@/components/HistoryDrawer';
import { useAuth } from '@/hooks/useAuth';
import { getMyPerformance, getMyProgress } from '@/lib/testApi';
import type { Performance, Progress } from '@/lib/types';

export default function ProgressHub() {
  const [history, setHistory] = useState(false);
  return (
    <PageShell title="📊 Progress" subtitle="See how you are doing, fix your mistakes and compare with others." wide>
      <Summary />
      <HubTiles tiles={[
        { href: '/performance', icon: '🎯', title: 'My Performance', text: 'Accuracy by unit, your weak areas and time per question.', gradient: 'from-amber-500 to-orange-600' },
        { href: '/vault', icon: '🔁', title: 'Revision Vault', text: 'Every question you got wrong, saved to practise again.', gradient: 'from-rose-500 to-pink-600' },
        { href: '/leaderboard', icon: '🏆', title: 'Leaderboard', text: 'See where you stand, overall and cycle by cycle.', gradient: 'from-indigo-500 to-violet-600' },
      ]} />
      <button onClick={() => setHistory(true)} className="w-full sm:w-auto px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:shadow-md transition">🕘 Open my test history</button>
      {history && <HistoryDrawer onClose={() => setHistory(false)} />}
    </PageShell>
  );
}

// The student's own numbers at the top, so the page shows progress, not only links.
function Summary() {
  const { user } = useAuth();
  const [perf, setPerf] = useState<Performance | null>(null);
  const [prog, setProg] = useState<Progress | null>(null);

  useEffect(() => {
    if (!user) return;
    getMyPerformance().then(setPerf).catch(() => {});
    getMyProgress().then(setProg).catch(() => {});
  }, [user]);

  if (!user || !perf) return null;
  const { totals, trend, units } = perf;
  if (!totals.attempted) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-600">
        Your numbers will appear here after your first test. <Link href="/practice" className="font-bold text-indigo-700 hover:underline">Start a test</Link>
      </div>
    );
  }
  const latest = trend.length ? trend[trend.length - 1].score_percentage : null;
  const accuracy = Math.round((totals.correct / totals.attempted) * 100);
  const weakest = units.find((u) => u.attempted >= 3) ?? units[0];
  const days = prog?.exam_date ? Math.max(0, Math.round((Date.parse(prog.exam_date) - Date.parse(prog.today)) / 86400000)) : null;

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Num label="Latest test" value={latest === null ? '—' : `${latest}%`} />
        <Num label="Accuracy" value={`${accuracy}%`} note={`${totals.correct}/${totals.attempted} right`} />
        <Num label="Work on" value={weakest ? weakest.unit : '—'} note={weakest ? `${Math.round(weakest.accuracy)}% right` : undefined} small />
        <Num label="Days to exam" value={days === null ? '—' : String(days)} note={days === null ? 'Set it in Settings (profile menu)' : undefined} />
      </div>
      <Link href="/performance" className="inline-block mt-3 text-sm font-bold text-indigo-700 hover:underline">See full details →</Link>
    </section>
  );
}

function Num({ label, value, note, small }: { label: string; value: string; note?: string; small?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`font-black text-indigo-950 ${small ? 'text-sm leading-snug' : 'text-2xl'}`}>{value}</p>
      {note && <p className="text-[11px] text-slate-500">{note}</p>}
    </div>
  );
}
