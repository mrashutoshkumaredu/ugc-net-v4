"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { useAuth } from '@/hooks/useAuth';
import { getCatalog } from '@/lib/testApi';
import { UNIT_OPTIONS } from '@/lib/normalize';
import { formatPaperTitle } from '@/lib/testTitle';
import { classesSubtitle, formatClassName, type ClassTab } from '@/lib/classNames';
import { courseApi, type CourseChapter, type CourseSet } from '@/lib/courseApi';
import { classesApi, taskHref, type ClassRole, type ClassTask, type TaskKind, type TaskResult } from '@/lib/classesApi';
import type { Catalog } from '@/lib/types';

// Green only for a good score, so 0% is not shown as a success.
const scoreColour = (pct: number | null) => (pct === null ? 'text-slate-700' : pct >= 60 ? 'text-emerald-700' : pct >= 40 ? 'text-amber-700' : 'text-rose-700');

const DRILLS: [string, string][] = [
  ['arithmetic', 'Arithmetic'], ['tables', 'Tables & Powers'], ['formulas', 'Quick Formulas'], ['fractions', 'Fraction ↔ %'],
  ['estimation', 'Estimation'], ['percent', '% Change'], ['minidi', 'Mini DI'], ['series', 'Number Series'],
  ['coding', 'Coding & Letters'], ['alphabet', 'Alphabet Grid'], ['syllogism', 'Syllogism'],
];
const drillName = (d: string | null) => DRILLS.find(([id]) => id === d)?.[1] || d || '';

function describe(t: ClassTask) {
  if (t.kind === 'LESSON') return `Read lesson · Maths Course chapter ${t.chapter_no}`;
  if (t.kind === 'CHAPTER') return `Chapter practice · ${t.question_count ? `${t.question_count} questions` : 'practice set'}`;
  if (t.kind === 'FULL') return `Full paper · ${formatPaperTitle(t.paper_id || '')}`;
  if (t.kind === 'UNIT') return `${t.question_count} questions · ${t.topic ? `${t.topic} (${t.unit})` : t.unit}`;
  return `Speed Maths · ${drillName(t.drill)} · target ${'★'.repeat(t.target_stars || 1)}`;
}
const resultText = (t: ClassTask, r: TaskResult) =>
  t.kind === 'LESSON' ? 'Read ✓' : t.kind === 'SPEED' ? `${'★'.repeat(r.stars || 0)}${'☆'.repeat(3 - (r.stars || 0))} · ${r.points} pts` : `${r.score_percentage}% · ${r.correct}/${r.total}`;
const taskDone = (t: ClassTask, r: TaskResult | null | undefined) => Boolean(r) && (t.kind !== 'SPEED' || (r!.stars || 0) >= (t.target_stars || 1));
const fmtDate = (d: string | null) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');
const today = () => new Date().toISOString().slice(0, 10);

export default function ClassesClient() {
  const { user } = useAuth();
  const [role, setRole] = useState<ClassRole | null>(null);
  const [tab, setTab] = useState<ClassTab>('student');
  useEffect(() => {
    if (!user) return;
    classesApi.role().then((r) => { setRole(r); if (r.teacher_status === 'approved') setTab('teacher'); }).catch(() => setRole({ teacher_status: null, is_admin: false }));
  }, [user]);

  return (
    <PageShell title="📋 Classes & Tasks" subtitle={classesSubtitle(tab, role?.teacher_status)} requireLogin wide>
      <ClassesBody role={role} setRole={setRole} tab={tab} setTab={setTab} />
    </PageShell>
  );
}

function ClassesBody({ role, setRole, tab, setTab }: { role: ClassRole | null; setRole: React.Dispatch<React.SetStateAction<ClassRole | null>>; tab: ClassTab; setTab: (t: ClassTab) => void }) {
  return (
    <div className="space-y-4 rounded-2xl bg-[#f7f3e7] p-3 sm:p-4 text-[#111417]">
      <div className="flex gap-1 border-b border-slate-300" role="tablist">
        {([['student', '🎒 My Tasks'], ['teacher', '🧑‍🏫 Teach']] as const).map(([v, l]) => (
          <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)}
            className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px ${tab === v ? 'border-[#266b47] text-[#111417]' : 'border-transparent text-slate-500'}`}>{l}</button>
        ))}
      </div>
      {tab === 'student' ? <StudentView /> : <TeacherView role={role} onRequested={() => setRole((r) => ({ ...(r || { is_admin: false }), teacher_status: 'pending' }))} />}
    </div>
  );
}

// ---------------------------------------------------------------- student
function StudentView() {
  const [data, setData] = useState<Awaited<ReturnType<typeof classesApi.mine>> | null>(null);
  const [invites, setInvites] = useState<Awaited<ReturnType<typeof classesApi.myInvites>>>([]);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    classesApi.mine().then(setData).catch((e) => setErr(e.message));
    classesApi.myInvites().then(setInvites).catch(() => {});
  }, []);

  // Join link: /classes?join=CODE
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('join');
    if (c) {
      classesApi.joinClass(c).then((r) => { setMsg(`You joined "${r.name}".`); window.history.replaceState(null, '', '/classes'); load(); }).catch((e) => setErr(e.message));
    }
    load();
  }, [load]);

  const join = async () => {
    setErr(''); setMsg('');
    try { const r = await classesApi.joinClass(code); setMsg(`You joined "${r.name}".`); setCode(''); load(); } catch (e) { setErr((e as Error).message); }
  };

  const pending = (data?.tasks || []).filter((t) => !taskDone(t, t.result));
  const done = (data?.tasks || []).filter((t) => taskDone(t, t.result));

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-slate-800 mb-2">Join a class</p>
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Class code, e.g. 7K3QF9" maxLength={8}
              className="flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold tracking-widest uppercase" />
            <button onClick={join} disabled={code.trim().length < 4} className="px-4 py-2 bg-[#266b47] text-white text-sm font-bold rounded-lg disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed">Join</button>
          </div>
          {msg && <p className="text-xs text-emerald-700 mt-2">{msg}</p>}
          {err && <p className="text-xs text-rose-600 mt-2">{err}</p>}
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-slate-800 mb-2">My classes</p>
          {(data?.classes.length || 0) === 0 ? <p className="text-xs text-slate-500">You have not joined a class yet.</p> : (
            <ul className="space-y-1">
              {data!.classes.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span><strong>{formatClassName(c.name)}</strong> <span className="text-slate-500">· {c.teacher}</span></span>
                  <button onClick={() => classesApi.leaveClass(c.id).then(load)} className="text-xs text-slate-400 hover:text-rose-600">Leave</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {invites.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-bold text-amber-900">You have been invited</p>
          {invites.map((i) => (
            <div key={i.class_id} className="flex items-center justify-between gap-2 text-sm">
              <span><strong>{formatClassName(i.name)}</strong> · {i.teacher}</span>
              <span className="flex gap-2">
                <button onClick={() => classesApi.answerInvite(i.class_id, true).then(load)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg">Accept</button>
                <button onClick={() => classesApi.answerInvite(i.class_id, false).then(load)} className="px-3 py-1.5 bg-white border border-amber-300 text-xs font-bold rounded-lg">Decline</button>
              </span>
            </div>
          ))}
        </div>
      )}

      <section>
        <h2 className="text-base font-black text-[#111417] mb-2">To do <span className="text-slate-400 font-semibold">({pending.length})</span></h2>
        {pending.length === 0 ? <p className="text-sm text-slate-500">No pending tasks. 🎉</p> : (
          <div className="grid sm:grid-cols-2 gap-3">
            {pending.map((t) => {
              const overdue = t.due_on && t.due_on < today();
              return (
                <div key={t.id} className={`bg-white border rounded-2xl p-4 flex flex-col gap-2 ${overdue ? 'border-rose-300' : 'border-slate-200'}`}>
                  <div className="flex justify-between gap-2">
                    <p className="font-bold text-slate-900">{t.title}</p>
                    {t.due_on && <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 h-fit ${overdue ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{overdue ? 'Overdue · ' : 'Due '}{fmtDate(t.due_on)}</span>}
                  </div>
                  <p className="text-xs text-slate-500">{formatClassName(t.class_name)} · {describe(t)}</p>
                  {t.result && t.kind === 'SPEED' && <p className="text-xs text-amber-700">Best so far: {resultText(t, t.result)}</p>}
                  {['FULL', 'UNIT', 'CHAPTER'].includes(t.kind) && <p className="text-[11px] text-slate-500">Your first submitted attempt is the one your teacher sees.</p>}
                  <Link href={taskHref(t)} className="self-start mt-1 px-4 py-2 bg-[#266b47] hover:bg-[#1f5a3c] text-white text-sm font-bold rounded-lg">Start ▸</Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="text-base font-black text-[#111417] mb-2">Done <span className="text-slate-400 font-semibold">({done.length})</span></h2>
          <ul className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
            {done.map((t) => (
              <li key={t.id} className="p-3 flex justify-between gap-2 text-sm">
                <span><strong>✓ {t.title}</strong> <span className="text-slate-500">· {formatClassName(t.class_name)}</span></span>
                <span className={`font-bold shrink-0 ${scoreColour(t.result!.score_percentage)}`}>{resultText(t, t.result!)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- teacher
function TeacherView({ role, onRequested }: { role: ClassRole | null; onRequested: () => void }) {
  const [classes, setClasses] = useState<Awaited<ReturnType<typeof classesApi.teacherClasses>>>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const load = useCallback(() => { classesApi.teacherClasses().then(setClasses).catch((e) => setErr(e.message)); }, []);
  useEffect(() => { if (role?.teacher_status === 'approved') load(); }, [role, load]);

  if (!role) return <p className="text-sm text-slate-500">Loading…</p>;
  if (role.teacher_status !== 'approved') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center max-w-lg mx-auto">
        <p className="text-4xl mb-2">🧑‍🏫</p>
        <p className="font-bold text-slate-900">Teach on this site</p>
        <p className="text-sm text-slate-500 mt-1 mb-4">Create classes, add students by code or email, set papers, unit practice and Speed Maths games, and track each student&apos;s progress.</p>
        {role.teacher_status === 'pending' ? (
          <p className="text-sm font-bold text-amber-700">Your request has been sent. The site admin will approve it soon.</p>
        ) : (
          <button onClick={() => classesApi.requestTeacher().then(onRequested).catch((e) => setErr(e.message))} className="px-5 py-2.5 bg-[#266b47] text-white font-bold rounded-xl">
            {role.teacher_status === 'rejected' ? 'Ask again' : 'Request teacher access'}
          </button>
        )}
        {err && <p className="text-xs text-rose-600 mt-2">{err}</p>}
      </div>
    );
  }

  if (selected) return <ClassDetail classId={selected} onBack={() => { setSelected(null); load(); }} />;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New class name, e.g. NET Batch Dec 2026" maxLength={80}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <button disabled={!name.trim()} onClick={() => classesApi.createClass(name).then((id) => { setName(''); setSelected(id); }).catch((e) => setErr(e.message))}
          className="px-4 py-2 bg-[#266b47] text-white text-sm font-bold rounded-lg disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed">+ Create class</button>
      </div>
      {err && <p className="text-xs text-rose-600">{err}</p>}
      {classes.length === 0 ? <p className="text-sm text-slate-500">No classes yet. Create your first one above.</p> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map((c) => (
            <button key={c.id} onClick={() => setSelected(c.id)} className="text-left bg-[#266b47] text-white rounded-2xl p-4 shadow-md hover:-translate-y-0.5 transition">
              <p className="font-black text-lg">{formatClassName(c.name)}</p>
              <p className="text-xs text-white/80 mt-1">{c.students} student{c.students === 1 ? '' : 's'} · {c.tasks} task{c.tasks === 1 ? '' : 's'}</p>
              <p className="mt-3 text-xs font-bold bg-black/20 rounded-full px-2 py-0.5 inline-block tracking-widest">Code {c.join_code}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassDetail({ classId, onBack }: { classId: string; onBack: () => void }) {
  const [d, setD] = useState<Awaited<ReturnType<typeof classesApi.classDetail>> | null>(null);
  const [emails, setEmails] = useState('');
  const [note, setNote] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const load = useCallback(() => { classesApi.classDetail(classId).then(setD).catch((e) => setNote(e.message)); }, [classId]);
  useEffect(() => { load(); }, [load]);

  const joinLink = typeof window === 'undefined' || !d ? '' : `${window.location.origin}/classes?join=${d.class.join_code}`;
  const copy = (text: string) => { navigator.clipboard?.writeText(text).then(() => setNote('Copied.')).catch(() => {}); };

  const perStudent = useMemo(() => {
    if (!d) return [];
    return d.students.map((s) => {
      const rs = d.tasks.map((t) => ({ t, r: t.results.find((r) => r.user_id === s.user_id) }));
      const doneN = rs.filter(({ t, r }) => taskDone(t, r)).length;
      const scores = rs.filter(({ t, r }) => r && t.kind !== 'SPEED').map(({ r }) => Number(r!.score_percentage));
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      return { s, doneN, avg };
    }).sort((a, b) => a.doneN - b.doneN);
  }, [d]);

  if (!d) return <p className="text-sm text-slate-500">{note || 'Loading…'}</p>;
  const total = d.students.length;

  return (
    <div className="space-y-5">
      <div>
        <button onClick={onBack} className="text-sm font-bold text-[#266b47] hover:underline">← My classes</button>
      </div>

      <div className="rounded-2xl bg-[#111417] text-white p-5 grid sm:grid-cols-3 gap-4 items-center">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#f7f3e7]/70 font-bold">Class</p>
          <p className="text-2xl font-black">{formatClassName(d.class.name)}</p>
          <p className="text-xs text-[#f7f3e7]/70">{total} student{total === 1 ? '' : 's'} · {d.tasks.length} task{d.tasks.length === 1 ? '' : 's'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-[#f7f3e7]/70 font-bold">Join code</p>
          <p className="text-3xl font-black tracking-[0.3em]">{d.class.join_code}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => copy(joinLink)} className="px-3 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-bold">🔗 Copy join link</button>
          <button onClick={() => copy(`Join my UGC NET class "${formatClassName(d.class.name)}": ${joinLink} (code ${d.class.join_code})`)} className="px-3 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-bold">💬 Copy message for WhatsApp</button>
        </div>
      </div>
      {note && <p className="text-xs text-emerald-700">{note}</p>}

      {/* Tasks */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-[#111417]">Tasks</h2>
          <button onClick={() => setShowForm((v) => !v)} className="px-3 py-1.5 bg-[#266b47] text-white text-sm font-bold rounded-lg">{showForm ? 'Close' : '+ New task'}</button>
        </div>
        {showForm && <TaskForm classId={classId} onCreated={() => { setShowForm(false); load(); }} />}
        {d.tasks.length === 0 ? <p className="text-sm text-slate-500">No tasks yet.</p> : (
          <ul className="space-y-2">
            {d.tasks.map((t) => {
              const doneRs = t.results.filter((r) => taskDone(t, r));
              const pct = total ? Math.round((doneRs.length / total) * 100) : 0;
              const scores = t.kind === 'SPEED' ? [] : t.results.map((r) => Number(r.score_percentage));
              const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
              return (
                <li key={t.id} className="bg-white border border-slate-200 rounded-2xl">
                  <button onClick={() => setOpen(open === t.id ? null : t.id)} className="w-full text-left p-4 flex flex-col gap-3">
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="block font-bold text-slate-900">{t.title}</span>
                        <span className="block text-xs text-slate-500">{describe(t)}{t.due_on ? ` · due ${fmtDate(t.due_on)}` : ''}</span>
                      </span>
                      <span className="text-slate-400 shrink-0">{open === t.id ? '▴' : '▾'}</span>
                    </span>
                    <span className="block">
                      <span className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                        <span>{doneRs.length}/{total} done</span>
                        {avg !== null && <span>Avg {avg}%</span>}
                      </span>
                      <span className="block h-2 bg-slate-100 rounded-full overflow-hidden"><span className="block h-full bg-emerald-500" style={{ width: `${pct}%` }} /></span>
                    </span>
                  </button>
                  {open === t.id && (
                    <div className="border-t border-slate-100 p-3">
                      <ul className="divide-y divide-slate-100 text-sm">
                        {d.students.map((s) => {
                          const r = t.results.find((x) => x.user_id === s.user_id);
                          const ok = taskDone(t, r);
                          return (
                            <li key={s.user_id} className="py-1.5 flex justify-between gap-2">
                              <span>{s.name} <span className="text-slate-400 text-xs">{s.email}</span></span>
                              <span className={`font-bold text-xs ${ok ? 'text-emerald-700' : r ? 'text-amber-600' : 'text-slate-400'}`}>
                                {r ? resultText(t, r) : 'Not started'}{ok ? ' ✓' : ''}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      {t.kind === 'CHAPTER' && <QuestionStats taskId={t.id} />}
                      <button onClick={() => classesApi.deleteTask(t.id).then(load)} className="mt-2 text-xs text-slate-400 hover:text-rose-600">Delete task</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Students */}
      <section className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h2 className="text-base font-black text-[#111417] mb-2">Students</h2>
          {total === 0 ? <p className="text-sm text-slate-500">No students yet. Share the code or add emails.</p> : (
            <>
              <table className="hidden sm:table w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <th scope="col" className="py-1.5 pr-3 font-semibold">Name</th>
                    <th scope="col" className="py-1.5 pr-3 font-semibold">Email</th>
                    <th scope="col" className="py-1.5 pr-3 font-semibold">Tasks done</th>
                    <th scope="col" className="py-1.5 pr-3 font-semibold">Average</th>
                    <th scope="col" className="py-1.5 text-right font-semibold"><span className="sr-only">Remove</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {perStudent.map(({ s, doneN, avg }) => (
                    <tr key={s.user_id}>
                      <td className="py-2 pr-3 font-semibold">{s.name}</td>
                      <td className="py-2 pr-3 text-slate-500 max-w-[16rem] truncate">{s.email}</td>
                      <td className={`py-2 pr-3 font-bold ${d.tasks.length && doneN < d.tasks.length ? 'text-amber-600' : 'text-emerald-700'}`}>{doneN}/{d.tasks.length}</td>
                      <td className="py-2 pr-3 font-bold text-slate-600">{avg !== null ? `${avg}%` : '—'}</td>
                      <td className="py-2 text-right">
                        <button onClick={() => classesApi.remove(classId, s.user_id, null).then(load)} className="text-slate-300 hover:text-rose-600" aria-label={`Remove ${s.name}`}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="sm:hidden divide-y divide-slate-100 text-sm">
                {perStudent.map(({ s, doneN, avg }) => (
                  <li key={s.user_id} className="py-2 flex justify-between items-center gap-2">
                    <span className="min-w-0">
                      <span className="block font-semibold truncate">{s.name}</span>
                      <span className="block text-xs text-slate-400 truncate">{s.email}</span>
                    </span>
                    <span className="flex items-center gap-3 shrink-0 text-xs">
                      <span className={`font-bold ${d.tasks.length && doneN < d.tasks.length ? 'text-amber-600' : 'text-emerald-700'}`}>{doneN}/{d.tasks.length} tasks</span>
                      {avg !== null && <span className="font-bold text-slate-600">{avg}%</span>}
                      <button onClick={() => classesApi.remove(classId, s.user_id, null).then(load)} className="text-slate-300 hover:text-rose-600" aria-label={`Remove ${s.name}`}>✕</button>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h2 className="text-base font-black text-[#111417] mb-1">Add students by email</h2>
          <p className="text-xs text-slate-500 mb-2">One per line or separated by commas. They see an invite when they log in with that email.</p>
          <textarea value={emails} onChange={(e) => setEmails(e.target.value)} rows={3} placeholder="student1@gmail.com, student2@gmail.com"
            className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
          <button disabled={!emails.trim()} onClick={() => classesApi.invite(classId, emails.split(/[\s,;]+/).filter(Boolean)).then((n) => { setEmails(''); setNote(`${n} invite${n === 1 ? '' : 's'} added.`); load(); }).catch((e) => setNote(e.message))}
            className="mt-2 px-4 py-2 bg-[#266b47] text-white text-sm font-bold rounded-lg disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed">Add</button>
          {d.invites.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-bold text-slate-600 mb-1">Waiting to accept ({d.invites.length})</p>
              <ul className="text-xs space-y-1">
                {d.invites.map((e) => (
                  <li key={e} className="flex justify-between"><span className="text-slate-600">{e}</span>
                    <button onClick={() => classesApi.remove(classId, null, e).then(load)} className="text-slate-300 hover:text-rose-600" aria-label={`Cancel invite ${e}`}>✕</button></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-orange-300 bg-white p-4">
        <h2 className="text-base font-black text-[#111417]">Danger zone</h2>
        <p className="text-xs text-slate-600 mt-1">Deleting a class removes it and all its tasks.</p>
        {confirmDel ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-orange-800 font-semibold">Delete this class and all its tasks?</span>
            <button onClick={() => classesApi.deleteClass(classId).then(onBack)} className="px-3 py-1.5 bg-orange-700 text-white rounded-lg font-bold">Yes, delete</button>
            <button onClick={() => setConfirmDel(false)} className="px-3 py-1.5 border border-slate-300 rounded-lg font-bold">Keep</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)} className="mt-3 px-4 py-2 border border-orange-600 text-orange-800 text-sm font-bold rounded-lg hover:bg-orange-50">Delete class</button>
        )}
      </section>
    </div>
  );
}

function TaskForm({ classId, onCreated }: { classId: string; onCreated: () => void }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [course, setCourse] = useState<{ chapters: CourseChapter[]; sets: CourseSet[] } | null>(null);
  const [chapter, setChapter] = useState(1);
  const [setId, setSetId] = useState('');
  const [kind, setKind] = useState<TaskKind>('FULL');
  const [paper, setPaper] = useState('');
  const [unit, setUnit] = useState(UNIT_OPTIONS[0].value);
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(20);
  const [drill, setDrill] = useState('fractions');
  const [stars, setStars] = useState(2);
  const [due, setDue] = useState('');
  const [title, setTitle] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { getCatalog().then((c) => { setCatalog(c); setPaper(c.papers[0]?.paper_id || ''); }).catch(() => {}); }, []);
  useEffect(() => { courseApi.catalog().then(setCourse).catch(() => {}); }, []);
  const chapterSets = (course?.sets || []).filter((x) => x.chapter_no === chapter || (chapter === 0 && !x.chapter_no));
  useEffect(() => { setSetId(chapterSets[0]?.id || ''); }, [chapter, course]); // eslint-disable-line react-hooks/exhaustive-deps
  const chTitle = (no: number) => course?.chapters.find((c) => c.no === no)?.title || `Chapter ${no}`;
  const setInfo = course?.sets.find((x) => x.id === setId);

  const topics = (catalog?.topics || []).filter((t) => t.unit === unit);
  const autoTitle = kind === 'FULL' ? `Full paper: ${formatPaperTitle(paper)}` : kind === 'UNIT' ? `${count} Qs: ${topic || unit}`
    : kind === 'LESSON' ? `Read: Chapter ${chapter} ${chTitle(chapter)}` : kind === 'CHAPTER' ? (setInfo?.title || 'Chapter practice')
    : `Speed Maths: ${drillName(drill)} ${'★'.repeat(stars)}`;
  const sel = 'w-full border border-slate-300 rounded-lg p-2 text-sm bg-white';

  const save = async () => {
    setErr('');
    try {
      await classesApi.createTask(classId, {
        title: title.trim() || autoTitle, kind,
        paper_id: kind === 'FULL' ? paper : null, unit: kind === 'UNIT' ? unit : null, topic: kind === 'UNIT' ? topic || null : null,
        question_count: kind === 'UNIT' ? count : kind === 'CHAPTER' ? setInfo?.questions ?? null : null,
        drill: kind === 'SPEED' ? drill : null, target_stars: kind === 'SPEED' ? stars : null,
        due_on: due || null,
        chapter_no: kind === 'LESSON' || kind === 'CHAPTER' ? (chapter || null) : null, set_id: kind === 'CHAPTER' ? setId : null,
      });
      onCreated();
    } catch (e) { setErr((e as Error).message); }
  };

  return (
    <div className="bg-white border border-slate-300 rounded-2xl p-4 space-y-3">
      <div className="flex rounded-lg bg-slate-100 p-1 w-fit border border-slate-200">
        {([['FULL', '📄 Full paper'], ['UNIT', '🎯 Unit-wise practice'], ['LESSON', '📖 Read lesson'], ['CHAPTER', '📝 Chapter practice'], ['SPEED', '⚡ Speed Maths']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setKind(v)} className={`px-3 py-1.5 text-xs font-bold rounded-md ${kind === v ? 'bg-[#266b47] text-white' : 'text-slate-600'}`}>{l}</button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {kind === 'FULL' && (
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Paper
            <select className={sel} value={paper} onChange={(e) => setPaper(e.target.value)}>
              {(catalog?.papers || []).map((p) => <option key={p.paper_id} value={p.paper_id}>{formatPaperTitle(p.paper_id)}</option>)}
            </select>
          </label>
        )}
        {kind === 'UNIT' && (
          <>
            <label className="text-xs font-semibold text-slate-600">Unit
              <select className={sel} value={unit} onChange={(e) => { setUnit(e.target.value); setTopic(''); }}>
                {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">Topic
              <select className={sel} value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="">All topics in this unit</option>
                {topics.map((t) => <option key={t.topic} value={t.topic}>{t.topic} ({t.question_count})</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">Number of questions
              <input type="number" min={1} max={200} className={sel} value={count} onChange={(e) => setCount(Number(e.target.value) || 1)} />
            </label>
          </>
        )}
        {(kind === 'LESSON' || kind === 'CHAPTER') && (
          <label className="text-xs font-semibold text-slate-600">Maths Course chapter
            <select className={sel} value={chapter} onChange={(e) => setChapter(Number(e.target.value))}>
              {(course?.chapters || []).map((c) => <option key={c.no} value={c.no}>Chapter {c.no}: {c.title}</option>)}
              {kind === 'CHAPTER' && <option value={0}>Tests and mocks</option>}
            </select>
          </label>
        )}
        {kind === 'CHAPTER' && (
          <label className="text-xs font-semibold text-slate-600">Practice set
            <select className={sel} value={setId} onChange={(e) => setSetId(e.target.value)}>
              {chapterSets.map((x) => <option key={x.id} value={x.id}>{x.title} ({x.questions} Qs, {x.minutes} min)</option>)}
            </select>
          </label>
        )}
        {kind === 'LESSON' && <p className="text-xs text-slate-500 sm:col-span-2">Your students can read this chapter&apos;s full lesson once you assign it.</p>}
        {kind === 'UNIT' && <p className="text-xs text-slate-500 sm:col-span-2">The questions are picked once now, so every student in the class gets the same set in the same order.</p>}
        {kind === 'SPEED' && (
          <>
            <label className="text-xs font-semibold text-slate-600">Game
              <select className={sel} value={drill} onChange={(e) => setDrill(e.target.value)}>
                {DRILLS.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">Target
              <select className={sel} value={stars} onChange={(e) => setStars(Number(e.target.value))}>
                <option value={1}>★ 1 star</option><option value={2}>★★ 2 stars</option><option value={3}>★★★ 3 stars</option>
              </select>
            </label>
          </>
        )}
        <label className="text-xs font-semibold text-slate-600">Due date (optional)
          <input type="date" className={sel} value={due} min={today()} onChange={(e) => setDue(e.target.value)} />
        </label>
        <label className="text-xs font-semibold text-slate-600">Title (optional)
          <input className={sel} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={autoTitle} maxLength={100} />
        </label>
      </div>
      {err && <p className="text-xs text-rose-600">{err}</p>}
      <button onClick={save} disabled={(kind === 'FULL' && !paper) || (kind === 'CHAPTER' && !setId)} className="px-5 py-2 bg-[#266b47] text-white text-sm font-bold rounded-lg disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed">Assign to class</button>
    </div>
  );
}

// Teacher: which questions of a chapter-practice task most students got wrong.
function QuestionStats({ taskId }: { taskId: string }) {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof courseApi.taskStats>> | null>(null);
  useEffect(() => { courseApi.taskStats(taskId).then(setRows).catch(() => setRows([])); }, [taskId]);
  if (!rows) return <p className="text-xs text-slate-400 mt-2">Loading question stats…</p>;
  const any = rows.some((r) => r.answered > 0);
  if (!any) return <p className="text-xs text-slate-400 mt-2">Question stats appear when students submit.</p>;
  const sorted = [...rows].sort((a, b) => b.wrong / Math.max(1, b.answered) - a.wrong / Math.max(1, a.answered));
  return (
    <div className="mt-3">
      <p className="text-xs font-bold text-slate-600 mb-1">Questions most got wrong</p>
      <ul className="space-y-1">
        {sorted.slice(0, 10).map((r) => {
          const pct = r.answered ? Math.round((r.wrong / r.answered) * 100) : 0;
          return (
            <li key={r.position} className="flex items-center gap-2 text-xs">
              <span className="w-8 font-bold text-slate-600">Q{r.position}</span>
              <span className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><span className={`block h-full ${pct >= 50 ? 'bg-rose-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} /></span>
              <span className="w-24 text-right font-semibold text-slate-600">{pct}% wrong ({r.wrong}/{r.answered})</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
