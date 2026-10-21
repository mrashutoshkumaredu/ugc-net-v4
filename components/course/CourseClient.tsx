"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { useAuth } from '@/hooks/useAuth';
import { courseApi, partLetter, PART_STYLE, type CourseChapter, type CourseQuestion, type CourseResult, type CourseSet } from '@/lib/courseApi';
import Icon, { type IconName } from '@/components/Icon';

// Sanitised HTML renderer (client only, see MathText.tsx).
const MathText = dynamic(() => import('@/components/quiz/MathText'), { ssr: false });

type View = { kind: 'home' } | { kind: 'chapter'; no: number } | { kind: 'set'; id: string };

function readView(): { view: View; task: string | null } {
  const p = new URLSearchParams(window.location.search);
  const task = p.get('task');
  if (p.get('set')) return { view: { kind: 'set', id: p.get('set')! }, task };
  if (p.get('ch')) return { view: { kind: 'chapter', no: Number(p.get('ch')) }, task };
  return { view: { kind: 'home' }, task };
}

export default function CourseClient() {
  return (
    <PageShell title="Maths Course" icon="learn" subtitle="Mathematical Aptitude, Reasoning and Data Interpretation for Paper 1, chapter by chapter, from the very basics. Practice is free for everyone." wide>
      <CourseBody />
    </PageShell>
  );
}

function CourseBody() {
  const [data, setData] = useState<{ chapters: CourseChapter[]; sets: CourseSet[] } | null>(null);
  const [err, setErr] = useState('');
  const [view, setView] = useState<View>({ kind: 'home' });
  const [task, setTask] = useState<string | null>(null);
  // Parts the student has opened or closed by hand; until then only the first part is open.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const { user } = useAuth();

  const load = useCallback(() => { courseApi.catalog().then(setData).catch((e) => setErr(e.message)); }, []);
  useEffect(() => { load(); }, [load, user]);
  useEffect(() => {
    const r = readView(); setView(r.view); setTask(r.task);
    const onPop = () => { const x = readView(); setView(x.view); setTask(x.task); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (v: View) => {
    const url = v.kind === 'home' ? '/course' : v.kind === 'chapter' ? `/course?ch=${v.no}` : `/course?set=${encodeURIComponent(v.id)}`;
    window.history.pushState(null, '', url);
    setView(v); setTask(null); window.scrollTo(0, 0);
  };

  if (err) return <p className="text-sm text-rose-600">{err}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  if (view.kind === 'set') {
    const set = data.sets.find((s) => s.id === view.id);
    return <Player setId={view.id} taskId={task} onBack={() => { load(); go(set?.chapter_no ? { kind: 'chapter', no: set.chapter_no } : { kind: 'home' }); }} />;
  }
  if (view.kind === 'chapter') {
    const ch = data.chapters.find((c) => c.no === view.no);
    if (!ch) return <p className="text-sm text-slate-500">Chapter not found.</p>;
    return <Chapter ch={ch} sets={data.sets.filter((s) => s.chapter_no === ch.no)} taskId={task} onBack={() => go({ kind: 'home' })} onOpenSet={(id) => go({ kind: 'set', id })} />;
  }

  const parts = Array.from(new Set(data.chapters.map((c) => c.part)));
  const tests = data.sets.filter((s) => !s.chapter_no);
  const diag = tests.find((s) => s.kind === 'diagnostic');
  const testsOpen = 'tests' in toggled ? toggled.tests : true;
  return (
    <div className="space-y-6">
      {diag && (
        <button onClick={() => go({ kind: 'set', id: diag.id })} className="w-full text-left rounded-2xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-900 text-white p-5 shadow-lg hover:shadow-xl transition">
          <p className="text-xs uppercase tracking-widest text-indigo-200 font-bold">Start here</p>
          <p className="text-xl font-black mt-1 flex items-center gap-2"><Icon name="stethoscope" className="w-5 h-5" />Diagnostic Test</p>
          <p className="text-sm text-indigo-100">{diag.questions} questions, one from each chapter. Find out which chapters to start with.{diag.best !== null ? ` Your best: ${diag.best}%.` : ''}</p>
        </button>
      )}

      <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
        <strong className="inline-flex items-center gap-1"><Icon name="book" className="w-3.5 h-3.5" />Lesson notes open</strong> · <strong className="inline-flex items-center gap-1"><Icon name="lock" className="w-3.5 h-3.5" />Lesson notes locked</strong>: they open when your teacher assigns that chapter to your class.
        Practice sets in every chapter are free for everyone. The number (for example 0/1) shows practice sets done.
      </p>

      {parts.map((part, idx) => {
        const st = PART_STYLE[partLetter(part)];
        const inPart = data.chapters.filter((c) => c.part === part);
        const isOpen = part in toggled ? toggled[part] : idx === 0;
        return (
          <section key={part}>
            <SectionToggle open={isOpen} onToggle={() => setToggled((t) => ({ ...t, [part]: !isOpen }))}
              icon={st.icon} title={part.replace(/^Part [A-D] - /, '')} count={`${inPart.length} chapter${inPart.length === 1 ? '' : 's'}`} />
            {isOpen && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {inPart.map((c) => {
                const cs = data.sets.filter((s) => s.chapter_no === c.no);
                const done = cs.filter((s) => s.best !== null).length;
                const pct = cs.length ? Math.round((done / cs.length) * 100) : 0;
                return (
                  <button key={c.no} onClick={() => go({ kind: 'chapter', no: c.no })}
                    className="min-w-0 text-left bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition flex gap-3 items-center">
                    <span className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${st.gradient} text-white font-black text-lg flex items-center justify-center`}>{c.no}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-slate-900 leading-tight">{c.title}</span>
                      <span className="block text-[11px] text-slate-500 truncate">{c.subtitle}</span>
                      <span className="mt-1.5 flex items-center gap-2">
                        <span className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><span className="block h-full bg-emerald-500" style={{ width: `${pct}%` }} /></span>
                        <span className="text-[10px] font-bold text-slate-500 inline-flex items-center gap-1"><Icon name={c.can_read ? 'book' : 'lock'} className="w-3 h-3" />{done}/{cs.length}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>}
          </section>
        );
      })}

      <section>
        <SectionToggle open={testsOpen} onToggle={() => setToggled((t) => ({ ...t, tests: !testsOpen }))}
          icon="finish" title="Tests and mocks" count={`${tests.filter((s) => s.kind !== 'diagnostic').length} tests`} />
        {testsOpen && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {tests.filter((s) => s.kind !== 'diagnostic').map((s) => (
            <button key={s.id} onClick={() => go({ kind: 'set', id: s.id })} className="min-w-0 text-left bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition flex items-center gap-3">
              <span className="min-w-0 flex-1">
                {/* "Class 21: Arithmetic Test" -> "Arithmetic Test": class numbers clashed with chapter numbers. */}
                <span className="block font-bold text-slate-900">{s.title.replace(/^Class\s+\d+\s*:\s*/i, '')}</span>
                <span className="block text-xs text-slate-500">{s.questions} questions · {s.minutes} min</span>
              </span>
              {s.best !== null
                ? <span className="shrink-0 text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1">✓ Best {s.best}%</span>
                : <span className="shrink-0 text-xs font-bold text-indigo-700">Start ▸</span>}
            </button>
          ))}
        </div>}
      </section>
    </div>
  );
}

// A heading that is clearly a button: bordered row, visible chevron and a Show/Hide word.
function SectionToggle({ open, onToggle, title, count, icon }: { open: boolean; onToggle: () => void; title: string; count: string; icon: IconName }) {
  return (
    <button type="button" onClick={onToggle} aria-expanded={open}
      className="w-full flex items-center justify-between gap-3 text-left bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm rounded-xl px-4 py-3 transition">
      <span className="text-lg font-black text-indigo-950 inline-flex items-center gap-2"><Icon name={icon} className="w-5 h-5 text-indigo-700" />{title} <span className="text-xs font-semibold text-slate-500">({count})</span></span>
      <span className="shrink-0 flex items-center gap-2 text-xs font-bold text-indigo-700">
        {open ? 'Hide' : 'Show'}
        <span className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-sm" aria-hidden>{open ? '▴' : '▾'}</span>
      </span>
    </button>
  );
}

// ------------------------------------------------------------------ chapter
function Chapter({ ch, sets, taskId, onBack, onOpenSet }: { ch: CourseChapter; sets: CourseSet[]; taskId: string | null; onBack: () => void; onOpenSet: (id: string) => void }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'learn' | 'practice'>(ch.can_read ? 'learn' : 'practice');
  const [lesson, setLesson] = useState<{ locked: boolean; html?: string } | null>(null);
  const [doneMsg, setDoneMsg] = useState('');
  const st = PART_STYLE[partLetter(ch.part)];

  useEffect(() => {
    if (!user) { setLesson({ locked: true }); return; }
    courseApi.lesson(ch.no).then(setLesson).catch(() => setLesson({ locked: true }));
  }, [ch.no, user]);
  useEffect(() => { if (taskId) setTab('learn'); }, [taskId]);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm font-bold text-indigo-700 hover:underline">← All chapters</button>
      <div className={`rounded-2xl bg-gradient-to-r ${st.gradient} text-white p-5 shadow-md`}>
        <p className="text-xs uppercase tracking-widest font-bold text-white/80">{ch.part} · Chapter {ch.no}</p>
        <p className="text-2xl sm:text-3xl font-black">{ch.title}</p>
        <p className="text-sm text-white/90">{ch.subtitle}</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200" role="tablist">
        {([['learn', lesson && !lesson.locked ? 'book' : 'lock', 'Learn'], ['practice', 'write', `Practice (${sets.length})`]] as const).map(([v, ic, l]) => (
          <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)}
            className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px ${tab === v ? 'border-indigo-600 text-indigo-900' : 'border-transparent text-slate-500'}`}><span className="inline-flex items-center gap-1.5"><Icon name={ic} />{l}</span></button>
        ))}
      </div>

      {tab === 'learn' ? (
        !lesson ? <p className="text-sm text-slate-500">Loading…</p> : lesson.locked ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center max-w-lg mx-auto">
            <p className="mb-2 flex justify-center text-slate-500"><Icon name="lock" className="w-10 h-10" /></p>
            <p className="font-bold text-slate-900">The full lesson is available to students in a class</p>
            <p className="text-sm text-slate-500 mt-1 mb-4">Ask your teacher to assign this chapter&apos;s lesson. Join their class on the Classes page with the code they give you. The practice questions are free for everyone.</p>
            <div className="flex justify-center gap-3">
              <Link href="/classes" className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg">Join a class</Link>
              <button onClick={() => setTab('practice')} className="px-4 py-2 border border-slate-300 text-sm font-bold rounded-lg">Go to practice</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-css-tags */}
            <link rel="stylesheet" href="/book-lesson.css" />
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 overflow-x-auto">
              <MathText html={lesson.html || ''} className="book-lesson max-w-3xl mx-auto" />
            </div>
            {taskId && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm font-semibold text-emerald-900 flex items-center gap-2"><Icon name="clipboard" className="w-4 h-4" />This lesson is a class task. When you have read it, mark it as done.</p>
                {doneMsg ? <p className="text-sm font-bold text-emerald-700">{doneMsg}</p> : (
                  <button onClick={() => courseApi.lessonDone(taskId).then(() => setDoneMsg('✓ Marked as read')).catch((e) => setDoneMsg(e.message))}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg">I have read it ✓</button>
                )}
              </div>
            )}
            <div className="text-center"><button onClick={() => setTab('practice')} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl">Now practise ▸</button></div>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sets.map((s) => (
            <button key={s.id} onClick={() => onOpenSet(s.id)} className="text-left bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition flex justify-between gap-3 items-center">
              <span>
                <span className="block font-bold text-slate-900">{s.title}</span>
                <span className="block text-xs text-slate-500">{s.questions} questions · {s.minutes} min · Levels 1 to 3, with real PYQs</span>
              </span>
              <span className={`shrink-0 text-xs font-bold rounded-full px-2.5 py-1 ${s.best === null ? 'bg-indigo-600 text-white' : s.best >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {s.best === null ? 'Start ▸' : `Best ${s.best}%`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ player
const LEVEL: Record<string, string> = { R: 'Revision', '1': 'Level 1 · Basic', '2': 'Level 2 · Standard', '3': 'Level 3 · Exam level' };

function Player({ setId, taskId, onBack }: { setId: string; taskId: string | null; onBack: () => void }) {
  const [info, setInfo] = useState<Awaited<ReturnType<typeof courseApi.setQuestions>> | null>(null);
  const [err, setErr] = useState('');
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState<CourseResult | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const started = useRef(Date.now());

  useEffect(() => {
    courseApi.setQuestions(setId).then((d) => {
      if (!d.set) { setErr('This practice set could not be found.'); return; }
      setInfo(d); setLeft(d.set.minutes * 60); started.current = Date.now();
    }).catch((e) => setErr(e.message));
  }, [setId]);

  const submit = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await courseApi.submit(setId, answers, Math.round((Date.now() - started.current) / 1000), taskId);
      setResult(r); setConfirm(false); window.scrollTo(0, 0);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }, [busy, setId, answers, taskId]);

  // Countdown; submits by itself at zero.
  useEffect(() => {
    if (!info || result) return;
    if (left <= 0) { submit(); return; }
    const t = window.setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left, info, result, submit]);

  const qs = info?.questions || [];
  const q: CourseQuestion | undefined = qs[i];
  const answered = useMemo(() => Object.keys(answers).length, [answers]);

  if (err) return <div className="space-y-3"><button onClick={onBack} className="text-sm font-bold text-indigo-700">← Back</button><p className="text-sm text-rose-600">{err}</p></div>;
  if (!info || !q) return <p className="text-sm text-slate-500">Loading…</p>;

  if (result) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="text-sm font-bold text-indigo-700 hover:underline">← Back to chapter</button>
        <div className="rounded-2xl bg-gradient-to-r from-indigo-950 to-indigo-900 text-white p-6 text-center">
          <p className="text-sm text-indigo-200 font-bold">{info.set!.title}</p>
          <p className="text-5xl font-black my-2">{result.score_percentage}%</p>
          <p className="text-sm text-indigo-100">{result.correct} of {result.total} correct{taskId ? ' · sent to your teacher' : ''}{!result.saved ? ' · log in to save your scores' : ''}</p>
        </div>
        <ol className="space-y-3">
          {qs.map((x, k) => {
            const key = result.key[String(x.id)];
            const chosen = answers[x.id];
            const ok = chosen === key.correct;
            return (
              <li key={x.id} className={`bg-white border-l-4 ${ok ? 'border-emerald-500' : chosen === undefined ? 'border-slate-300' : 'border-rose-500'} rounded-xl p-4 shadow-sm`}>
                <p className="text-xs font-bold text-slate-500 mb-1">Q{k + 1} {ok ? '✓' : chosen === undefined ? '· skipped' : '✗'} {x.source && <span className="ml-1 bg-amber-100 text-amber-800 rounded px-1.5">PYQ: {x.source}</span>}</p>
                {x.layout_html && <MathText html={x.layout_html} className="text-sm mb-2 overflow-x-auto" />}
                <MathText html={x.question_html} className="text-sm font-medium text-slate-900" />
                <ul className="mt-2 space-y-1 text-sm">
                  {x.options.map((o, j) => (
                    <li key={j} className={`px-3 py-1.5 rounded-lg border ${j === key.correct ? 'border-emerald-500 bg-emerald-50 font-semibold' : j === chosen ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`}>{j + 1}. {o}</li>
                  ))}
                </ul>
                {key.explanation && (
                  <div className="mt-2 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-3 text-sm text-amber-950">
                    <p className="font-bold text-xs mb-1">Step-by-step</p>
                    <MathText html={key.explanation} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0');
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="text-sm font-bold text-indigo-700 hover:underline">← Leave</button>
        <p className="text-sm font-bold text-slate-700 truncate">{info.set!.title}</p>
        <span className={`font-mono font-black text-lg px-3 py-1 rounded-lg inline-flex items-center gap-1.5 ${left <= 60 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-800'}`}><Icon name="timer" className="w-4 h-4" />{mm}:{ss}</span>
      </div>
      {taskId && <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5"><Icon name="clipboard" />Class task: your score is sent to your teacher when you submit.</p>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
            <span className="font-black text-indigo-950 text-base">Q{i + 1} of {qs.length}</span>
            {q.level && <span className="bg-slate-100 text-slate-700 font-bold rounded-full px-2 py-0.5">{LEVEL[q.level] || q.level}</span>}
            {q.source && <span className="bg-amber-100 text-amber-800 font-bold rounded-full px-2 py-0.5">PYQ: {q.source}</span>}
          </div>
          {q.layout_html && <div className="mb-3 bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-x-auto text-sm"><MathText html={q.layout_html} /></div>}
          <MathText html={q.question_html} className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed" />
          <div className="mt-4 space-y-2">
            {q.options.map((o, j) => {
              const sel = answers[q.id] === j;
              return (
                <button key={j} onClick={() => setAnswers((a) => ({ ...a, [q.id]: j }))}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition ${sel ? 'border-indigo-600 bg-indigo-50 font-semibold' : 'border-slate-200 hover:border-slate-300'}`}>
                  <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${sel ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{j + 1}</span>
                  <span>{o}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap justify-between gap-2">
            <button disabled={i === 0} onClick={() => setI(i - 1)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold disabled:opacity-40">« Back</button>
            <div className="flex gap-2">
              {answers[q.id] !== undefined && (
                <button onClick={() => setAnswers((a) => { const n = { ...a }; delete n[q.id]; return n; })} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold">Clear</button>
              )}
              {i < qs.length - 1 ? (
                <button onClick={() => setI(i + 1)} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">Next »</button>
              ) : (
                <button onClick={() => setConfirm(true)} className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold">Submit</button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 h-fit">
          <p className="text-xs font-bold text-slate-600 mb-2">{answered}/{qs.length} answered</p>
          <div className="grid grid-cols-5 gap-1.5">
            {qs.map((x, k) => (
              <button key={x.id} onClick={() => setI(k)}
                className={`h-9 rounded-lg text-xs font-bold ${k === i ? 'ring-2 ring-indigo-600' : ''} ${answers[x.id] !== undefined ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{k + 1}</button>
            ))}
          </div>
          {confirm ? (
            <div className="mt-3 text-xs space-y-2">
              <p className="font-semibold text-slate-700">Submit now? {qs.length - answered > 0 ? `${qs.length - answered} not answered.` : ''}</p>
              <div className="flex gap-2">
                <button disabled={busy} onClick={submit} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold">{busy ? '…' : 'Yes, submit'}</button>
                <button onClick={() => setConfirm(false)} className="flex-1 py-2 border border-slate-300 rounded-lg font-bold">Keep going</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirm(true)} className="mt-3 w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold">Submit</button>
          )}
        </div>
      </div>
    </div>
  );
}
