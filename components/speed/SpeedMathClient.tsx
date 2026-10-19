"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageShell from '@/components/PageShell';
import {
  alphabet, arithmetic, estimation, fractions, isCorrect, series, tables,
  type AlphaKind, type ArithOp, type Digits, type DrillId, type DrillQuestion, type TableKind,
} from '@/lib/drills';

const DRILLS: { id: DrillId; label: string; unit: string; blurb: string }[] = [
  { id: 'arithmetic', label: 'Arithmetic', unit: 'Maths', blurb: 'Add, subtract, multiply and divide in your head.' },
  { id: 'tables', label: 'Tables & Powers', unit: 'Maths', blurb: 'Tables to 20, squares to 30, cubes to 20, square and cube roots.' },
  { id: 'fractions', label: 'Fraction ↔ %', unit: 'Data Interpretation', blurb: 'Know 1/8 = 12.5% at a glance. The key skill for DI questions.' },
  { id: 'estimation', label: 'Estimation', unit: 'Data Interpretation', blurb: 'Pick the closest value quickly, without exact working.' },
  { id: 'series', label: 'Number Series', unit: 'Maths reasoning', blurb: 'Spot the rule and find the next or missing number.' },
  { id: 'alphabet', label: 'Alphabet Grid', unit: 'Logical reasoning', blurb: 'Letter positions and opposites, for coding-decoding and letter series.' },
];

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
  }
}

function settingsKey(drill: DrillId, s: Settings) {
  if (drill === 'arithmetic') return `${s.op}-${s.digits}`;
  if (drill === 'tables') return `${s.table}-${s.table === 'tables' ? s.base : ''}`;
  if (drill === 'alphabet') return s.alpha;
  return 'all';
}

// Personal bests live only in this browser (wrapped in try/catch: storage can be blocked).
function readBest(key: string) {
  try { return Number(window.localStorage.getItem(key) || 0); } catch { return 0; }
}
function writeBest(key: string, v: number) {
  try { window.localStorage.setItem(key, String(v)); } catch { /* ignore */ }
}

export default function SpeedMathClient() {
  return (
    <PageShell
      title="⚡ Speed Math & Logic"
      subtitle="Short drills for the calculation and pattern skills Paper 1 tests in Mathematical Reasoning, Logical Reasoning and Data Interpretation. Classic mode has no clock. Game mode races the clock."
      wide
    >
      <SpeedMathBody />
    </PageShell>
  );
}

function SpeedMathBody() {
  const [drill, setDrill] = useState<DrillId>('arithmetic');
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<'classic' | 'game'>('classic');
  const [gameSeconds, setGameSeconds] = useState(60);
  const [q, setQ] = useState<DrillQuestion | null>(null);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState<null | { ok: boolean; given: string }>(null);
  const [stats, setStats] = useState({ attempted: 0, correct: 0, streak: 0, totalMs: 0 });
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [finished, setFinished] = useState<null | { score: number; best: number; newBest: boolean }>(null);
  const shownAt = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const nextTimer = useRef<number | null>(null);

  const bestKey = `speedmath:best:${drill}:${settingsKey(drill, s)}:${gameSeconds}`;
  const info = useMemo(() => DRILLS.find((d) => d.id === drill)!, [drill]);

  const newQuestion = useCallback(() => {
    if (nextTimer.current) window.clearTimeout(nextTimer.current);
    setQ(makeQuestion(drill, s));
    setTyped('');
    setFeedback(null);
    shownAt.current = Date.now();
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [drill, s]);

  // Any change of drill, settings or mode starts afresh.
  useEffect(() => {
    setStats({ attempted: 0, correct: 0, streak: 0, totalMs: 0 });
    setRunning(false);
    setFinished(null);
    newQuestion();
  }, [newQuestion, mode, gameSeconds]);

  // Game clock.
  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      setRunning(false);
      const score = stats.correct;
      const best = readBest(bestKey);
      const newBest = score > best;
      if (newBest) writeBest(bestKey, score);
      setFinished({ score, best: Math.max(best, score), newBest });
      return;
    }
    const t = window.setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [running, timeLeft, stats.correct, bestKey]);

  const startGame = () => {
    setStats({ attempted: 0, correct: 0, streak: 0, totalMs: 0 });
    setFinished(null);
    setTimeLeft(gameSeconds);
    setRunning(true);
    newQuestion();
  };

  const canAnswer = q && !feedback && (mode === 'classic' || running);

  const submit = (given: string) => {
    if (!q || !canAnswer || !given.trim()) return;
    const ok = isCorrect(q, given);
    const ms = Date.now() - shownAt.current;
    setStats((st) => ({ attempted: st.attempted + 1, correct: st.correct + (ok ? 1 : 0), streak: ok ? st.streak + 1 : 0, totalMs: st.totalMs + ms }));
    setFeedback({ ok, given });
    // Right answers move on by themselves. In game mode wrong ones do too, after a short look.
    if (ok) nextTimer.current = window.setTimeout(newQuestion, 350);
    else if (mode === 'game') nextTimer.current = window.setTimeout(newQuestion, 1400);
  };

  const accuracy = stats.attempted ? Math.round((stats.correct / stats.attempted) * 100) : 0;
  const avgSec = stats.attempted ? (stats.totalMs / stats.attempted / 1000).toFixed(1) : '–';
  const best = typeof window === 'undefined' ? 0 : readBest(bestKey);

  const sel = 'text-xs border border-slate-300 rounded-lg p-2 bg-white font-semibold text-slate-700';

  return (
    <div className="space-y-4">
      {/* Drill tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {DRILLS.map((d) => (
          <button
            key={d.id}
            onClick={() => setDrill(d.id)}
            className={`text-left rounded-xl border p-3 transition ${drill === d.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
          >
            <span className="block text-sm font-bold">{d.label}</span>
            <span className={`block text-[11px] ${drill === d.id ? 'text-indigo-100' : 'text-slate-500'}`}>{d.unit}</span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <p className="text-xs text-slate-500">{info.blurb}</p>
          <div className="flex flex-wrap items-center gap-2">
            {drill === 'arithmetic' && (
              <>
                <select aria-label="Operation" className={sel} value={s.op} onChange={(e) => setS({ ...s, op: e.target.value as ArithOp })}>
                  <option value="mixed">Mixed operations</option>
                  <option value="add">Addition</option>
                  <option value="sub">Subtraction</option>
                  <option value="mul">Multiplication</option>
                  <option value="div">Division</option>
                </select>
                <select aria-label="Digits" className={sel} value={s.digits} onChange={(e) => setS({ ...s, digits: e.target.value as Digits })}>
                  <option value="1">1-digit</option>
                  <option value="2">2-digit</option>
                  <option value="3">3-digit</option>
                  <option value="mixed">Mixed digits</option>
                </select>
              </>
            )}
            {drill === 'tables' && (
              <>
                <select aria-label="Type" className={sel} value={s.table} onChange={(e) => setS({ ...s, table: e.target.value as TableKind })}>
                  <option value="tables">Tables (2–20)</option>
                  <option value="squares">Squares (11–30)</option>
                  <option value="cubes">Cubes (2–20)</option>
                  <option value="roots">Square and cube roots</option>
                </select>
                {s.table === 'tables' && (
                  <select aria-label="Table of" className={sel} value={String(s.base)} onChange={(e) => setS({ ...s, base: e.target.value === 'random' ? 'random' : Number(e.target.value) })}>
                    <option value="random">All tables, mixed</option>
                    {Array.from({ length: 19 }, (_, i) => i + 2).map((n) => <option key={n} value={n}>Table of {n}</option>)}
                  </select>
                )}
              </>
            )}
            {drill === 'alphabet' && (
              <select aria-label="Alphabet drill" className={sel} value={s.alpha} onChange={(e) => setS({ ...s, alpha: e.target.value as AlphaKind })}>
                <option value="letterToNum">Letter → number</option>
                <option value="numToLetter">Number → letter</option>
                <option value="opposite">Opposite letter</option>
              </select>
            )}
            <div className="flex rounded-lg bg-slate-100 p-1">
              <button onClick={() => setMode('classic')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${mode === 'classic' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>Classic</button>
              <button onClick={() => setMode('game')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${mode === 'game' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500'}`}>⏱️ Game</button>
            </div>
            {mode === 'game' && (
              <select aria-label="Game length" className={sel} value={gameSeconds} onChange={(e) => setGameSeconds(Number(e.target.value))}>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={120}>2 minutes</option>
              </select>
            )}
          </div>
        </div>

        {mode === 'game' && (
          <div className="mb-4">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>{running ? `${timeLeft}s left` : `${gameSeconds}s round`}</span>
              <span>Best: {best} correct</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 transition-all duration-1000 ease-linear" style={{ width: `${running ? (timeLeft / gameSeconds) * 100 : 100}%` }} />
            </div>
          </div>
        )}

        {mode === 'game' && !running ? (
          <div className="text-center py-10">
            {finished ? (
              <>
                <p className="text-sm text-slate-500">Time&apos;s up!</p>
                <p className="text-4xl font-extrabold text-indigo-950 my-2">{finished.score} correct</p>
                <p className="text-sm text-slate-600 mb-5">
                  {finished.newBest ? '🎉 New personal best!' : `Your best: ${finished.best}`} · {stats.attempted} answered · {accuracy}% accuracy
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-600 mb-5">Answer as many as you can in {gameSeconds} seconds.</p>
            )}
            <button onClick={startGame} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md">
              {finished ? 'Play again' : 'Start'}
            </button>
          </div>
        ) : q && (
          <div className="text-center py-4">
            <p className={`font-extrabold text-indigo-950 tracking-wide ${q.prompt.length > 22 ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'}`}>{q.prompt}</p>
            {q.hint && <p className="text-xs text-slate-500 mt-2">{q.hint}</p>}

            {q.input === 'choice' ? (
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mt-6">
                {q.choices!.map((c) => {
                  let cls = 'bg-white border-slate-300 hover:border-indigo-400';
                  if (feedback) {
                    if (c === q.answer) cls = 'bg-emerald-50 border-emerald-500 text-emerald-900';
                    else if (c === feedback.given) cls = 'bg-rose-50 border-rose-500 text-rose-900';
                  }
                  return (
                    <button key={c} disabled={!canAnswer} onClick={() => submit(c)} className={`py-3 rounded-xl border-2 text-lg font-bold transition ${cls}`}>
                      {c}
                    </button>
                  );
                })}
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); submit(typed); }} className="flex gap-2 max-w-sm mx-auto mt-6">
                <input
                  ref={inputRef}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  inputMode={q.input === 'number' ? 'numeric' : 'text'}
                  maxLength={q.input === 'text' ? 1 : 12}
                  autoComplete="off"
                  disabled={!canAnswer}
                  aria-label="Your answer"
                  className={`flex-1 text-center text-2xl font-bold border-2 rounded-xl p-3 outline-none ${feedback ? (feedback.ok ? 'border-emerald-500 bg-emerald-50' : 'border-rose-500 bg-rose-50') : 'border-slate-300 focus:border-indigo-500'}`}
                />
                <button type="submit" disabled={!canAnswer} className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50">Check</button>
              </form>
            )}

            <div className="min-h-[3.5rem] mt-4">
              {feedback && !feedback.ok && (
                <div className="max-w-md mx-auto text-sm">
                  <p className="font-bold text-rose-700">Answer: {q.answer}</p>
                  {q.explain && <p className="text-slate-600 mt-1">{q.explain}</p>}
                  {mode === 'classic' && (
                    <button onClick={newQuestion} className="mt-3 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg">Next →</button>
                  )}
                </div>
              )}
              {feedback?.ok && <p className="font-bold text-emerald-700">✓ Correct</p>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 text-center border-t border-slate-100 pt-4 mt-2">
          {[
            ['Correct', `${stats.correct}/${stats.attempted}`],
            ['Accuracy', `${accuracy}%`],
            ['Streak', `${stats.streak}`],
            ['Avg time', avgSec === '–' ? '–' : `${avgSec}s`],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-lg font-extrabold text-indigo-950">{value}</p>
              <p className="text-[11px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
