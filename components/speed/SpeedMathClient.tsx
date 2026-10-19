"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageShell from '@/components/PageShell';
import {
  alphabet, arithmetic, coding, estimation, formulas, fractions, isCorrect, miniDI, percent, series, syllogism, tables,
  type AlphaKind, type ArithOp, type Digits, type DrillId, type DrillQuestion, type TableKind,
} from '@/lib/drills';
import { isMuted, setMuted, sounds } from '@/lib/sound';
import { classesApi } from '@/lib/classesApi';

// ---------------------------------------------------------------------------
// Catalogue: three "worlds", each with its own colour.
// `pace` is how many correct answers per minute earn three stars.
type Drill = { id: DrillId; label: string; icon: string; blurb: string; pace: number };
type World = { id: string; title: string; icon: string; tagline: string; gradient: string; ring: string; drills: Drill[] };

const WORLDS: World[] = [
  {
    id: 'calc', title: 'Calculation', icon: '🧮', tagline: 'Mental maths for Mathematical Aptitude',
    gradient: 'from-orange-500 to-rose-500', ring: 'ring-orange-300',
    drills: [
      { id: 'arithmetic', label: 'Arithmetic', icon: '➕', blurb: 'Add, subtract, multiply, divide', pace: 20 },
      { id: 'tables', label: 'Tables & Powers', icon: '✖️', blurb: 'Tables, squares, cubes, roots', pace: 22 },
      { id: 'formulas', label: 'Quick Formulas', icon: '💰', blurb: 'Interest, profit, speed, discounts', pace: 8 },
    ],
  },
  {
    id: 'di', title: 'Data Interpretation', icon: '📊', tagline: 'The skills behind Q1–5 of every paper',
    gradient: 'from-sky-500 to-indigo-600', ring: 'ring-sky-300',
    drills: [
      { id: 'fractions', label: 'Fraction ↔ %', icon: '🔢', blurb: '1/8 = 12.5% at a glance', pace: 18 },
      { id: 'estimation', label: 'Estimation', icon: '🎯', blurb: 'Pick the closest value fast', pace: 12 },
      { id: 'percent', label: '% Change', icon: '📈', blurb: 'Rise, fall, more than, less than', pace: 10 },
      { id: 'minidi', label: 'Mini DI', icon: '🗂️', blurb: 'Read a table, answer quickly', pace: 6 },
    ],
  },
  {
    id: 'logic', title: 'Reasoning', icon: '🧩', tagline: 'Patterns for Mathematical and Logical Reasoning',
    gradient: 'from-emerald-500 to-teal-600', ring: 'ring-emerald-300',
    drills: [
      { id: 'series', label: 'Number Series', icon: '🔁', blurb: 'Next or missing number', pace: 10 },
      { id: 'coding', label: 'Coding & Letters', icon: '🔤', blurb: 'TABLE → UBCMF, letter series', pace: 6 },
      { id: 'alphabet', label: 'Alphabet Grid', icon: '🅰️', blurb: 'Positions and opposites', pace: 24 },
      { id: 'syllogism', label: 'Syllogism', icon: '⭕', blurb: 'Does the conclusion follow?', pace: 10 },
    ],
  },
];
const ALL = WORLDS.flatMap((w) => w.drills.map((d) => ({ ...d, world: w })));

type Settings = { op: ArithOp; digits: Digits; table: TableKind; base: number | 'random'; alpha: AlphaKind };
const DEFAULT_SETTINGS: Settings = { op: 'mixed', digits: '2', table: 'tables', base: 'random', alpha: 'letterToNum' };

function makeQuestion(drill: DrillId, s: Settings): DrillQuestion {
  const r = Math.random;
  switch (drill) {
    case 'arithmetic': return arithmetic(r, s.op, s.digits);
    case 'tables': return tables(r, s.table, s.base);
    case 'alphabet': return alphabet(r, s.alpha);
    case 'fractions': return fractions(r);
    case 'series': return series(r);
    case 'estimation': return estimation(r);
    case 'coding': return coding(r);
    case 'syllogism': return syllogism(r);
    case 'percent': return percent(r);
    case 'formulas': return formulas(r);
    case 'minidi': return miniDI(r);
  }
}

// Saved in this browser only. Every read/write is guarded: storage can be blocked.
type Record_ = { points: number; stars: number };
const recordKey = (id: DrillId) => `speedmath:record:${id}`;
function readRecord(id: DrillId): Record_ {
  try { return JSON.parse(window.localStorage.getItem(recordKey(id)) || '') as Record_; } catch { return { points: 0, stars: 0 }; }
}
function writeRecord(id: DrillId, r: Record_) {
  try { window.localStorage.setItem(recordKey(id), JSON.stringify(r)); } catch { /* ignore */ }
}

const starsFor = (correct: number, seconds: number, pace: number) => {
  const perMin = (correct / seconds) * 60;
  return perMin >= pace ? 3 : perMin >= pace * 0.6 ? 2 : perMin >= pace * 0.3 ? 1 : 0;
};
const Stars = ({ n, size = 'text-base' }: { n: number; size?: string }) => (
  <span className={`${size} tracking-tight`} aria-label={`${n} of 3 stars`}>
    {[0, 1, 2].map((i) => <span key={i} className={i < n ? 'text-amber-400' : 'text-white/25'}>★</span>)}
  </span>
);

export default function SpeedMathClient() {
  return (
    <PageShell title="⚡ Speed Math & Logic" subtitle="Quick-fire games for the calculation and pattern skills Paper 1 tests. Beat the clock, build combos, collect stars." wide>
      <SpeedMathBody />
    </PageShell>
  );
}

function SpeedMathBody() {
  const [active, setActive] = useState<DrillId | null>(null);
  const [records, setRecords] = useState<Partial<Record<DrillId, Record_>>>({});

  const loadRecords = useCallback(() => {
    const r: Partial<Record<DrillId, Record_>> = {};
    for (const d of ALL) r[d.id] = readRecord(d.id);
    setRecords(r);
  }, []);
  useEffect(() => { loadRecords(); }, [loadRecords]);

  // Opened from a class task: /speed-math?drill=fractions&task=<id>
  const [taskId, setTaskId] = useState<string | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const d = p.get('drill') as DrillId | null;
    if (d && ALL.some((x) => x.id === d)) {
      setActive(d);
      setTaskId(p.get('task'));
    }
  }, []);

  if (active) {
    const d = ALL.find((x) => x.id === active)!;
    return <Arena drill={d} world={d.world} taskId={taskId} onExit={() => { setTaskId(null); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); setActive(null); loadRecords(); }} />;
  }

  const totalStars = ALL.reduce((s, d) => s + (records[d.id]?.stars || 0), 0);
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950 via-violet-900 to-fuchsia-900 text-white p-5 flex items-center justify-between gap-4 shadow-lg">
        <div>
          <p className="text-xs uppercase tracking-widest text-violet-200 font-bold">Your collection</p>
          <p className="text-3xl font-black mt-1">{totalStars} <span className="text-amber-400">★</span> <span className="text-base font-semibold text-violet-200">of {ALL.length * 3}</span></p>
        </div>
        <p className="text-xs text-violet-100 max-w-xs text-right hidden sm:block">Play a timed round in any game. The faster and more accurately you answer, the more stars you earn.</p>
      </div>

      {WORLDS.map((w) => (
        <section key={w.id}>
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-lg font-black text-indigo-950">{w.icon} {w.title}</h2>
            <p className="text-xs text-slate-500">{w.tagline}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {w.drills.map((d) => {
              const rec = records[d.id];
              return (
                <button
                  key={d.id}
                  onClick={() => { setActive(d.id); document.documentElement.requestFullscreen?.().catch(() => {}); }}
                  className={`group relative overflow-hidden text-left rounded-2xl p-4 text-white bg-gradient-to-br ${w.gradient} shadow-md hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all`}
                >
                  <span className="absolute -right-3 -bottom-4 text-6xl opacity-20 group-hover:scale-110 transition-transform" aria-hidden>{d.icon}</span>
                  <span className="block text-2xl mb-1" aria-hidden>{d.icon}</span>
                  <span className="block font-extrabold leading-tight">{d.label}</span>
                  <span className="block text-[11px] text-white/80 mt-0.5">{d.blurb}</span>
                  <span className="mt-3 flex items-center justify-between">
                    <Stars n={rec?.stars || 0} />
                    <span className="text-[11px] font-bold bg-black/20 rounded-full px-2 py-0.5">{rec?.points ? `Best ${rec.points}` : 'Play ▸'}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
type Phase = 'ready' | 'playing' | 'over';

function Arena({ drill, world, taskId, onExit }: { drill: Drill; world: World; taskId: string | null; onExit: () => void }) {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<'game' | 'classic'>('game');
  const [seconds, setSeconds] = useState(60);
  const [phase, setPhase] = useState<Phase>('ready');
  const [q, setQ] = useState<DrillQuestion | null>(null);
  const [qKey, setQKey] = useState(0);
  const [typed, setTyped] = useState('');
  const [fb, setFb] = useState<null | { ok: boolean; given: string }>(null);
  const [st, setSt] = useState({ answered: 0, correct: 0, streak: 0, bestStreak: 0, points: 0 });
  const [timeLeft, setTimeLeft] = useState(60);
  const [popup, setPopup] = useState<null | { text: string; id: number }>(null);
  const [result, setResult] = useState<null | { stars: number; record: boolean; best: number }>(null);
  const [muted, setMutedState] = useState(false);
  useEffect(() => { setMutedState(isMuted()); }, []);
  const toggleMute = () => { const v = !muted; setMuted(v); setMutedState(v); if (!v) { sounds.unlock(); sounds.correct(); } };
  const inputRef = useRef<HTMLInputElement>(null);
  const nextT = useRef<number | null>(null);

  const next = useCallback(() => {
    if (nextT.current) window.clearTimeout(nextT.current);
    setQ(makeQuestion(drill.id, s));
    setQKey((k) => k + 1);
    setTyped('');
    setFb(null);
  }, [drill.id, s]);

  // Keep the cursor in the answer box: after every new question it goes straight back there.
  useEffect(() => {
    if (phase === 'playing') inputRef.current?.focus({ preventScroll: true });
  }, [qKey, phase]);

  const start = () => {
    sounds.unlock();
    sounds.start();
    setSt({ answered: 0, correct: 0, streak: 0, bestStreak: 0, points: 0 });
    setResult(null);
    setTimeLeft(seconds);
    setPhase('playing');
    next();
  };

  // Settings changed: back to the start screen.
  useEffect(() => { setPhase('ready'); setResult(null); }, [s, mode, seconds]);

  // Countdown (game mode only).
  useEffect(() => {
    if (phase !== 'playing' || mode !== 'game') return;
    if (timeLeft <= 0) {
      if (nextT.current) window.clearTimeout(nextT.current);
      const stars = starsFor(st.correct, seconds, drill.pace);
      const prev = readRecord(drill.id);
      const record = st.points > prev.points;
      writeRecord(drill.id, { points: Math.max(prev.points, st.points), stars: Math.max(prev.stars, stars) });
      setResult({ stars, record, best: Math.max(prev.points, st.points) });
      sounds.end(record);
      if (taskId) classesApi.completeSpeedTask(taskId, stars, st.points).catch(() => {});
      setPhase('over');
      return;
    }
    if (timeLeft <= 5) sounds.tick();
    const t = window.setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [phase, mode, timeLeft, st.correct, st.points, seconds, drill.id, drill.pace, taskId]);

  const canAnswer = phase === 'playing' && q && !fb;

  const answer = useCallback((given: string) => {
    if (!canAnswer || !q || !given.trim()) return;
    const ok = isCorrect(q, given);
    if (ok) sounds.correct(st.streak + 1); else sounds.wrong();
    setFb({ ok, given });
    setSt((p) => {
      const streak = ok ? p.streak + 1 : 0;
      const gain = ok ? 10 + Math.min(streak - 1, 10) * 2 : 0;
      if (ok) setPopup({ text: `+${gain}${streak >= 3 ? `  🔥×${streak}` : ''}`, id: Date.now() });
      return { answered: p.answered + 1, correct: p.correct + (ok ? 1 : 0), streak, bestStreak: Math.max(p.bestStreak, streak), points: p.points + gain };
    });
    if (ok) nextT.current = window.setTimeout(next, 450);
    else if (mode === 'game') nextT.current = window.setTimeout(next, 1500);
  }, [canAnswer, q, mode, next, st.streak]);

  // Keyboard: 1-4 or A-D for options, N or Enter for next after a wrong answer in classic.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onExit(); return; }
      if (phase !== 'playing' || !q) return;
      if (q.input === 'choice' && q.choices && !fb) {
        const i = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase());
        if (i >= 0 && i < q.choices.length) { e.preventDefault(); answer(q.choices[i]); }
      } else if (fb && !fb.ok && mode === 'classic' && (e.key === 'Enter' || e.key.toLowerCase() === 'n')) {
        e.preventDefault(); next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, q, fb, mode, answer, next, onExit]);

  const frac = mode === 'game' ? Math.max(0, timeLeft / seconds) : 1;
  // Green (120°) → yellow (55°) → red (0°) as time runs out.
  const hue = Math.round(120 * frac);
  const urgent = mode === 'game' && phase === 'playing' && timeLeft <= 5;
  const accuracy = st.answered ? Math.round((st.correct / st.answered) * 100) : 0;
  const sel = 'text-xs rounded-lg px-2.5 py-2 bg-white/10 border border-white/20 text-white font-semibold [&>option]:text-slate-900';
  const letters = ['A', 'B', 'C', 'D'];

  const settings = useMemo(() => (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {drill.id === 'arithmetic' && (
        <>
          <select aria-label="Operation" className={sel} value={s.op} onChange={(e) => setS({ ...s, op: e.target.value as ArithOp })}>
            <option value="mixed">Mixed operations</option><option value="add">Addition</option><option value="sub">Subtraction</option><option value="mul">Multiplication</option><option value="div">Division</option>
          </select>
          <select aria-label="Digits" className={sel} value={s.digits} onChange={(e) => setS({ ...s, digits: e.target.value as Digits })}>
            <option value="1">1-digit</option><option value="2">2-digit</option><option value="3">3-digit</option><option value="mixed">Mixed digits</option>
          </select>
        </>
      )}
      {drill.id === 'tables' && (
        <>
          <select aria-label="Type" className={sel} value={s.table} onChange={(e) => setS({ ...s, table: e.target.value as TableKind })}>
            <option value="tables">Tables (2–20)</option><option value="squares">Squares (11–30)</option><option value="cubes">Cubes (2–20)</option><option value="roots">Square and cube roots</option>
          </select>
          {s.table === 'tables' && (
            <select aria-label="Table of" className={sel} value={String(s.base)} onChange={(e) => setS({ ...s, base: e.target.value === 'random' ? 'random' : Number(e.target.value) })}>
              <option value="random">All tables</option>
              {Array.from({ length: 19 }, (_, i) => i + 2).map((n) => <option key={n} value={n}>Table of {n}</option>)}
            </select>
          )}
        </>
      )}
      {drill.id === 'alphabet' && (
        <select aria-label="Alphabet drill" className={sel} value={s.alpha} onChange={(e) => setS({ ...s, alpha: e.target.value as AlphaKind })}>
          <option value="letterToNum">Letter → number</option><option value="numToLetter">Number → letter</option><option value="opposite">Opposite letter</option>
        </select>
      )}
      <div className="flex rounded-lg bg-white/10 p-1">
        <button onClick={() => setMode('game')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${mode === 'game' ? 'bg-amber-400 text-slate-900' : 'text-white/70'}`}>⏱️ Timed</button>
        <button onClick={() => setMode('classic')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${mode === 'classic' ? 'bg-white text-slate-900' : 'text-white/70'}`}>🧘 Practice</button>
      </div>
      {mode === 'game' && (
        <select aria-label="Round length" className={sel} value={seconds} onChange={(e) => setSeconds(Number(e.target.value))}>
          <option value={30}>30 s</option><option value={60}>60 s</option><option value={120}>2 min</option>
        </select>
      )}
    </div>
  ), [drill.id, s, mode, seconds, sel]);

  return (
    <div className="fixed inset-0 z-[60] h-[100dvh] flex flex-col bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white">
      {/* Top bar */}
      <div className={`shrink-0 bg-gradient-to-r ${world.gradient} px-4 py-2.5 flex items-center justify-between gap-3`}>
        <button onClick={onExit} className="text-sm font-bold bg-black/20 hover:bg-black/30 rounded-lg px-3 py-1.5">← All games</button>
        <p className="font-black text-lg truncate flex-1 text-center">{drill.icon} {drill.label}</p>
        <button onClick={toggleMute} aria-label={muted ? 'Sound on' : 'Sound off'} title={muted ? 'Sound on' : 'Sound off'} className="text-lg bg-black/20 hover:bg-black/30 rounded-lg w-9 h-9 flex items-center justify-center">{muted ? '🔇' : '🔊'}</button>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-white/80 font-bold">Score</p>
          <p className="text-xl font-black tabular-nums leading-none">{st.points}</p>
        </div>
      </div>

      {/* Timer bar: shrinks and turns from green to yellow to red */}
      {mode === 'game' && (
        <div className="shrink-0 px-4 pt-3">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className={urgent ? 'text-red-400 sm-pulse' : 'text-white/80'}>⏱ {phase === 'playing' ? `${timeLeft}s` : `${seconds}s`}</span>
            <span className="text-white/70">🔥 Combo ×{st.streak}</span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width,background-color] duration-1000 ease-linear ${urgent ? 'sm-pulse' : ''}`}
              style={{ width: `${phase === 'playing' ? frac * 100 : 100}%`, backgroundColor: `hsl(${hue} 85% 50%)`, boxShadow: `0 0 12px hsl(${hue} 85% 50% / 0.7)` }}
            />
          </div>
        </div>
      )}

      <div className="relative flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-4 flex flex-col items-center justify-center">
        {phase === 'ready' && (
          <div className="text-center space-y-5 sm-pop">
            <p className="text-6xl" aria-hidden>{drill.icon}</p>
            <div>
              <p className="text-2xl font-black">{drill.label}</p>
              <p className="text-sm text-white/70 mt-1">{drill.blurb}</p>
            </div>
            {settings}
            <button onClick={start} className="px-10 py-4 rounded-2xl text-xl font-black text-slate-900 bg-gradient-to-r from-amber-300 to-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.5)] hover:scale-105 active:scale-95 transition-transform">
              ▶ {mode === 'game' ? 'Start round' : 'Start practice'}
            </button>
            {taskId && <p className="text-sm font-bold text-amber-200">📋 Class task: play a timed round. Your best round is sent to your teacher.</p>}
            {mode === 'game' && <p className="text-xs text-white/60">Three stars at about {drill.pace} correct answers a minute.</p>}
          </div>
        )}

        {phase === 'over' && result && (
          <div className="text-center space-y-4 sm-pop">
            <p className="text-sm uppercase tracking-widest text-white/60 font-bold">Time&apos;s up!</p>
            <Stars n={result.stars} size="text-6xl" />
            {result.record && <p className="text-amber-300 font-black text-lg sm-pulse">🏆 New record!</p>}
            <p className="text-5xl font-black tabular-nums">{st.points}</p>
            <p className="text-sm text-white/70">{st.correct} correct · {accuracy}% accuracy · best combo ×{st.bestStreak} · your best {result.best}</p>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={start} className="px-8 py-3 rounded-2xl font-black text-slate-900 bg-gradient-to-r from-amber-300 to-amber-500 hover:scale-105 transition-transform">↻ Play again</button>
              <button onClick={() => setPhase('ready')} className="px-6 py-3 rounded-2xl font-bold bg-white/10 hover:bg-white/20">Settings</button>
            </div>
          </div>
        )}

        {phase === 'playing' && q && (
          <div key={qKey} className={`w-full text-center ${q.table ? 'max-w-5xl lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center' : 'max-w-2xl'}`}>
            {popup && <span key={popup.id} className="sm-float absolute left-1/2 top-6 -translate-x-1/2 text-2xl font-black text-emerald-300 pointer-events-none">{popup.text}</span>}

            <div>
            {q.table && (
              <table className="mx-auto mb-3 text-sm bg-white/5 rounded-xl overflow-hidden sm-pop">
                <thead className="bg-white/10">
                  <tr>{q.table.headers.map((h) => <th key={h} className="px-4 py-1.5 font-bold text-sky-200">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {q.table.rows.map((row, i) => (
                    <tr key={i} className="border-t border-white/10">{row.map((c, j) => <td key={j} className="px-4 py-1 tabular-nums">{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className={`rounded-3xl border-2 border-white/15 bg-white/5 px-5 py-5 sm-pop ${fb && !fb.ok ? 'sm-shake border-red-400/60' : ''} ${fb?.ok ? 'border-emerald-400/70' : ''}`}>
              <p className={`font-black tracking-wide ${q.prompt.length > 50 ? 'text-xl sm:text-2xl' : q.prompt.length > 22 ? 'text-2xl sm:text-4xl' : 'text-5xl sm:text-6xl'}`}>{q.prompt}</p>
              {q.hint && <p className={`mt-3 ${drill.id === 'syllogism' ? 'text-lg font-bold text-amber-200' : 'text-sm text-white/60'}`}>{q.hint}</p>}
            </div>
            </div>
            <div>

            {q.input === 'choice' ? (
              <div className={`grid ${q.choices!.length === 2 ? 'grid-cols-2' : q.table ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-3 mt-4 ${q.table ? 'lg:mt-0' : ''}`}>
                {q.choices!.map((c, i) => {
                  let look = 'from-indigo-700 to-violet-800 border-indigo-300/50 hover:from-indigo-600 hover:to-violet-700';
                  if (fb) {
                    if (c === q.answer) look = 'from-emerald-500 to-emerald-700 border-emerald-200 sm-glow';
                    else if (c === fb.given) look = 'from-red-500 to-red-700 border-red-200';
                    else look = 'from-indigo-900 to-violet-950 border-white/10 opacity-50';
                  }
                  return (
                    <button
                      key={c}
                      disabled={!canAnswer}
                      onClick={() => answer(c)}
                      style={{ animationDelay: `${i * 70}ms` }}
                      className={`sm-pop sm-kbc relative flex items-center gap-3 bg-gradient-to-r ${look} border-2 px-6 py-3 text-left text-lg font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:hover:scale-100`}
                    >
                      <span className="text-amber-300 font-black">{letters[i]}:</span>
                      <span className="flex-1">{c}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); answer(typed); }} className="flex gap-3 max-w-md mx-auto mt-4">
                <input
                  ref={inputRef}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  inputMode={q.input === 'number' ? 'numeric' : 'text'}
                  maxLength={q.input === 'text' ? Math.max(1, q.answer.length) : 12}
                  autoComplete="off"
                  autoFocus
                  readOnly={!canAnswer}
                  aria-label="Your answer"
                  placeholder="?"
                  className={`flex-1 min-w-0 text-center text-3xl font-black rounded-2xl px-4 py-3 bg-white/10 border-2 outline-none placeholder:text-white/30 uppercase ${fb ? (fb.ok ? 'border-emerald-400 bg-emerald-500/20' : 'border-red-400 bg-red-500/20') : 'border-white/30 focus:border-amber-300'}`}
                />
                <button type="submit" disabled={!canAnswer} className="px-6 rounded-2xl font-black text-slate-900 bg-gradient-to-r from-amber-300 to-amber-500 disabled:opacity-40">Go</button>
              </form>
            )}

            <div className="min-h-[4rem] mt-3">
              {fb && !fb.ok && (
                <div className="sm-pop text-sm">
                  <p className="font-black text-red-300 text-base">Answer: {q.answer}</p>
                  {q.explain && <p className="text-white/70 mt-1">{q.explain}</p>}
                  {mode === 'classic' && <button onClick={next} className="mt-3 px-6 py-2 rounded-xl font-bold bg-white/15 hover:bg-white/25">Next ▸</button>}
                </div>
              )}
              {fb?.ok && <p className="font-black text-emerald-300 text-lg sm-pop">✓ Correct!</p>}
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom stats */}
      <div className="shrink-0 grid grid-cols-4 text-center border-t border-white/10 bg-black/20">
        {[['✅', 'Correct', `${st.correct}`], ['🎯', 'Accuracy', `${accuracy}%`], ['🔥', 'Combo', `×${st.streak}`], ['🏅', 'Best combo', `×${st.bestStreak}`]].map(([icon, label, v]) => (
          <div key={label} className="py-2">
            <p className="text-lg font-black tabular-nums">{icon} {v}</p>
            <p className="text-[10px] uppercase tracking-wider text-white/50 font-bold">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
