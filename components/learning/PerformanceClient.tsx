"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { UNIT_OPTIONS } from '@/lib/normalize';
import { normalizeUnit } from '@/lib/scoring';
import { getMyPerformance, getMyProgress, saveMySettings } from '@/lib/testApi';
import { MISTAKE_TAGS, type Performance, type Progress } from '@/lib/types';
import { formatTestLabel } from '@/lib/testTitle';

// NTA gives 60 minutes for 50 Paper 1 questions in practice: about 72 s each.
const TARGET_SECONDS = 72;

const shortUnit = (u: string) => UNIT_OPTIONS.find((o) => o.value === normalizeUnit(u))?.label.replace(/^Unit [IVX]+: /, '') ?? u;

export default function PerformanceClient() {
  return (
    <PageShell title="My Performance" subtitle="Built from every question you have answered since 17 October 2026. Only you can see this page." requireLogin>
      <PerformanceBody />
    </PageShell>
  );
}

function PerformanceBody() {
  const [perf, setPerf] = useState<Performance | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyPerformance().then(setPerf).catch((e) => setError(e instanceof Error ? e.message : 'Could not load.'));
    getMyProgress().then(setProgress);
  }, []);

  if (error) return <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">{error}</p>;
  if (!perf) return <p className="text-sm text-slate-500">Loading…</p>;

  const { totals } = perf;
  const accuracy = totals.attempted ? Math.round((totals.correct / totals.attempted) * 100) : 0;
  const tagTotal = Object.values(perf.tags).reduce((a, b) => a + (b || 0), 0);

  if (!totals.attempted) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-600">
          Nothing to show yet. Take a full paper, a unit practice or today&apos;s Daily Practice, and your strengths and weak spots will appear here.{' '}
          <Link href="/practice" className="font-bold text-indigo-700 hover:underline">Start a test</Link>
        </div>
        {progress && <SettingsCard progress={progress} onSaved={setProgress} />}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Questions answered" value={String(totals.attempted)} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Avg time / question" value={totals.avg_seconds ? `${Math.round(totals.avg_seconds)} s` : '—'} hint={`Exam pace ≈ ${TARGET_SECONDS} s`} />
        <Stat label="Day streak" value={progress ? `${progress.streak} 🔥` : '—'} />
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
        <h2 className="text-sm font-bold text-slate-800">Accuracy by unit, weakest first</h2>
        <p className="text-xs text-slate-500 mb-3">Bars show the % you answered correctly. Time is your average per question in that unit.</p>
        <ul className="space-y-2.5">
          {perf.units.map((u) => {
            const slow = (u.avg_seconds ?? 0) > TARGET_SECONDS * 1.25;
            const weak = u.accuracy < 50;
            return (
              <li key={u.unit} className="text-xs" title={`${shortUnit(u.unit)}: ${u.correct}/${u.attempted} correct (${u.accuracy}%), ${u.avg_seconds ?? '—'} s per question`}>
                <div className="flex justify-between gap-2 mb-1">
                  <span className="font-semibold text-slate-700 truncate">
                    {shortUnit(u.unit)}
                    {weak && <span className="ml-2 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">Needs work</span>}
                    {slow && <span className="ml-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">Slow</span>}
                  </span>
                  <span className="text-slate-600 shrink-0"><strong className="text-slate-900">{u.accuracy}%</strong> · {u.correct}/{u.attempted} · {u.avg_seconds ? `${Math.round(u.avg_seconds)} s` : '—'}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden" aria-hidden>
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.max(2, u.accuracy)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <h2 className="text-sm font-bold text-slate-800">Why you lose marks</h2>
          {tagTotal === 0 ? (
            <p className="text-xs text-slate-500 mt-2">Tag your wrong answers in Deep Review (after each test) and the reasons will add up here.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {MISTAKE_TAGS.map((t) => {
                const n = perf.tags[t.value] || 0;
                const pct = Math.round((n / tagTotal) * 100);
                return (
                  <li key={t.value} className="text-xs">
                    <div className="flex justify-between mb-1"><span className="text-slate-700">{t.label}</span><span className="font-bold text-slate-900">{n} ({pct}%)</span></div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden" aria-hidden><div className="h-full bg-slate-700 rounded-full" style={{ width: `${pct}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <h2 className="text-sm font-bold text-slate-800">Guesses</h2>
          {perf.guesses.total === 0 ? (
            <p className="text-xs text-slate-500 mt-2">Use &quot;I&apos;m guessing&quot; during a test to see how often your guesses are right.</p>
          ) : (
            <p className="text-sm text-slate-700 mt-2">
              You marked <strong>{perf.guesses.total}</strong> answers as guesses and got <strong>{perf.guesses.correct}</strong> right
              ({Math.round((perf.guesses.correct / perf.guesses.total) * 100)}%). Correct guesses are in your{' '}
              <Link href="/vault" className="font-bold text-indigo-700 hover:underline">Lucky guesses</Link> folder.
            </p>
          )}
        </section>
      </div>

      <ScoreTrend trend={perf.trend} />

      {progress && <SettingsCard progress={progress} onSaved={setProgress} />}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-extrabold text-indigo-950 mt-1">{value}</p>
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

// Score % over the last attempts: one line, value labels on the first and
// last points, hover title on every point, and the same numbers as a list.
function ScoreTrend({ trend }: { trend: Performance['trend'] }) {
  if (trend.length < 2) return null;
  // Labels are sized for phones: the 640-wide drawing shrinks to about half on a phone screen.
  const W = 640, H = 200, P = { l: 58, r: 16, t: 30, b: 24 };
  const x = (i: number) => P.l + (i * (W - P.l - P.r)) / (trend.length - 1);
  const y = (v: number) => P.t + ((100 - v) * (H - P.t - P.b)) / 100;
  const path = trend.map((t, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(t.score_percentage).toFixed(1)}`).join(' ');
  const last = trend[trend.length - 1];

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
      <h2 className="text-sm font-bold text-slate-800">Score % over your last {trend.length} tests</h2>
      <p className="text-xs text-slate-500">Only tests where you answered at least one question.</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mt-2" role="img" aria-label={`Score trend: latest ${last.score_percentage}%`}>
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line x1={P.l} x2={W - P.r} y1={y(g)} y2={y(g)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={P.l - 8} y={y(g) + 7} textAnchor="end" fontSize="20" fill="#64748b">{g}%</text>
          </g>
        ))}
        <path d={path} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round" />
        {trend.map((t, i) => (
          <g key={t.id}>
            <circle cx={x(i)} cy={y(t.score_percentage)} r="12" fill="transparent">
              <title>{`${formatTestLabel(t.test_mode)}: ${t.score_percentage}% (${new Date(t.submitted_at).toLocaleDateString('en-IN')})`}</title>
            </circle>
            <circle cx={x(i)} cy={y(t.score_percentage)} r="4" fill="#4f46e5" stroke="#fff" strokeWidth="2" pointerEvents="none" />
          </g>
        ))}
        <text x={x(trend.length - 1)} y={y(last.score_percentage) - 12} textAnchor="end" fontSize="22" fontWeight="700" fill="#1e1b4b">{last.score_percentage}%</text>
      </svg>
      <details className="mt-2">
        <summary className="text-xs font-semibold text-indigo-700 cursor-pointer">Show as a list</summary>
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {[...trend].reverse().map((t) => (
            <li key={t.id} className="flex justify-between gap-2">
              <span className="truncate">{new Date(t.submitted_at).toLocaleDateString('en-IN')} · {formatTestLabel(t.test_mode)}</span>
              <span className="shrink-0 font-semibold text-slate-800">{t.score_percentage}% ({t.correct_answers}/{t.total_questions})</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function SettingsCard({ progress, onSaved }: { progress: Progress; onSaved: (p: Progress) => void }) {
  const [examDate, setExamDate] = useState(progress.exam_date ?? '');
  const [show, setShow] = useState(progress.show_on_leaderboard);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setMsg('');
    try {
      await saveMySettings(examDate || null, show);
      onSaved({ ...progress, exam_date: examDate || null, show_on_leaderboard: show });
      setMsg('Saved.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not save.');
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
      <h2 className="text-sm font-bold text-slate-800">Settings</h2>
      <label className="block text-xs font-semibold text-slate-600">
        My exam date (for the countdown on the home page)
        <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="mt-1 block border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
      </label>
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        Show me on the leaderboard (as first name + initial)
      </label>
      <div className="flex items-center gap-3">
        <button onClick={save} className="text-xs font-bold px-3 py-2 rounded-lg bg-indigo-600 text-white">Save settings</button>
        {msg && <span className="text-xs text-slate-600">{msg}</span>}
      </div>
    </section>
  );
}
