"use client";

// Admin page for student reports. Only emails in the `app_admins` table
// can use it: every database call below checks `is_admin()` on the server,
// so the check here only decides what to show.

import { useCallback, useEffect, useState } from 'react';
import TeacherApprovals from '@/components/admin/TeacherApprovals';
import MessagesPanel from '@/components/admin/MessagesPanel';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import SiteHeader from '@/components/SiteHeader';
import { useAuth } from '@/hooks/useAuth';
import { UNIT_OPTIONS, getPaperDisplayName } from '@/lib/normalize';
import { cleanNewlines } from '@/lib/scoring';
import { adminDeleteNote, adminListNotes, adminListReports, adminSaveNote, adminSetReportStatus, adminUpdateQuestion, isAdmin } from '@/lib/testApi';
import { markdownToHtml } from '@/lib/markdown';
import type { AdminReport, UnitNote } from '@/lib/types';

const MathText = dynamic(() => import('@/components/quiz/MathText'), { ssr: false });

type StatusFilter = 'Open' | 'Resolved' | 'ALL';
const OPTION_KEYS = ['option_a', 'option_b', 'option_c', 'option_d'] as const;

export default function AdminClient() {
  const { user, checkedSession } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<'REPORTS' | 'MESSAGES' | 'NOTES' | 'TEACHERS'>('REPORTS');
  const [filter, setFilter] = useState<StatusFilter>('Open');
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!checkedSession) return;
    if (!user) { setAllowed(false); return; }
    isAdmin().then(setAllowed);
  }, [checkedSession, user]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setReports(await adminListReports(filter === 'ALL' ? null : filter));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  if (allowed === null) {
    return (
      <div className="flex-1 flex flex-col">
        <SiteHeader />
        <p className="text-center text-slate-500 text-sm mt-16">Checking access…</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex-1 flex flex-col">
        <SiteHeader />
        <div className="text-center max-w-md mx-auto mt-16 px-4">
          <h1 className="text-xl font-bold text-slate-800 mb-2">Admins only</h1>
          <p className="text-sm text-slate-500 mb-4">Log in with an admin account to open this page.</p>
          <Link href="/" className="text-sm font-bold text-indigo-700 hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <SiteHeader />
      <main className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex gap-1 border-b border-slate-200" role="tablist">
          {([['REPORTS', 'Student reports'], ['MESSAGES', 'Messages'], ['NOTES', 'Revision notes'], ['TEACHERS', 'Teachers']] as const).map(([v, l]) => (
            <button
              key={v}
              role="tab"
              aria-selected={tab === v}
              onClick={() => setTab(v)}
              className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px ${tab === v ? 'border-indigo-600 text-indigo-900' : 'border-transparent text-slate-500'}`}
            >
              {l}
            </button>
          ))}
        </div>
        {tab === 'TEACHERS' ? <TeacherApprovals /> : tab === 'MESSAGES' ? <MessagesPanel /> : tab === 'NOTES' ? <NotesEditor /> : (<>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-indigo-900">Student reports</h1>
            <p className="text-xs text-slate-500">Each report shows the exact question, its paper and its number in that paper, regardless of how it was shuffled for the student.</p>
          </div>
          <div className="flex gap-1" role="group" aria-label="Filter reports">
            {(['Open', 'Resolved', 'ALL'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${filter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}
              >
                {f === 'ALL' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">{error}</p>}
        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {!loading && !error && reports.length === 0 && (
          <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6 text-center">No {filter === 'ALL' ? '' : filter.toLowerCase()} reports.</p>
        )}

        {reports.map((r) => (
          <ReportCard key={r.id} report={r} onChanged={load} />
        ))}
        </>)}
      </main>
    </div>
  );
}

function ReportCard({ report, onChanged }: { report: AdminReport; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(report.question);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const q = report.question;

  const save = async () => {
    setBusy(true);
    setMessage('');
    try {
      await adminUpdateQuestion(draft);
      setMessage('Question saved.');
      setEditing(false);
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status: string) => {
    setBusy(true);
    try {
      await adminSetReportStatus(report.id, status);
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not update.');
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full p-2 text-xs border border-slate-300 rounded-lg font-mono';

  return (
    <article className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-800">
            {getPaperDisplayName(q.paper_id)}{q.question_number ? `, Q${q.question_number}` : ''}
            <span className="ml-2 text-[11px] font-medium text-slate-400">ID {q.id}</span>
          </p>
          <p className="text-[11px] text-slate-500">{q.unit || 'No unit'}{q.is_dropped ? ' · Dropped by NTA' : ''}</p>
        </div>
        <span className={`self-start text-[11px] font-bold px-2 py-0.5 rounded-full ${report.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {report.status}
        </span>
      </header>

      <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-900">
        <p className="font-bold">{report.issue_type}</p>
        {report.comment && <p className="mt-1 whitespace-pre-line">{report.comment}</p>}
        <p className="mt-1 text-[11px] text-rose-700">{report.user_email || 'Unknown student'} · {new Date(report.created_at).toLocaleString('en-IN')}</p>
      </div>

      {!editing ? (
        <div className="space-y-2 text-sm">
          {q.layout_text && q.layout_text.trim() && (
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-slate-600">Reference material</summary>
              <MathText html={cleanNewlines(q.layout_text)} className="layout-text mt-2 overflow-x-auto" />
            </details>
          )}
          <MathText html={cleanNewlines(q.question_text)} className="whitespace-pre-line" />
          <ol className="space-y-1">
            {OPTION_KEYS.map((k, i) => (
              <li key={k} className={`flex gap-2 p-2 rounded-lg border text-xs ${i === q.correct_option ? 'border-emerald-500 bg-emerald-50 font-semibold' : 'border-slate-200'}`}>
                <span className="font-bold">{i + 1}.</span>
                <MathText html={cleanNewlines(q[k])} className="flex-1" />
                {i === q.correct_option && <span className="text-emerald-700 text-[11px]">Correct</span>}
              </li>
            ))}
          </ol>
          {q.ai_hint && <p className="text-xs text-amber-900 bg-amber-50 p-2 rounded-lg whitespace-pre-line"><strong>Explanation:</strong> {q.ai_hint}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-slate-600">Question text (HTML allowed)
            <textarea rows={4} className={field} value={draft.question_text} onChange={(e) => setDraft({ ...draft, question_text: e.target.value })} />
          </label>
          <label className="block text-[11px] font-semibold text-slate-600">Reference material (passage / table)
            <textarea rows={3} className={field} value={draft.layout_text ?? ''} onChange={(e) => setDraft({ ...draft, layout_text: e.target.value })} />
          </label>
          {OPTION_KEYS.map((k, i) => (
            <label key={k} className="block text-[11px] font-semibold text-slate-600">Option {i + 1}
              <input className={field} value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
            </label>
          ))}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="block text-[11px] font-semibold text-slate-600">Correct option
              <select className={field} value={draft.correct_option} onChange={(e) => setDraft({ ...draft, correct_option: Number(e.target.value) })}>
                {[0, 1, 2, 3].map((i) => <option key={i} value={i}>Option {i + 1}</option>)}
              </select>
            </label>
            <label className="block text-[11px] font-semibold text-slate-600">Unit
              <select className={field} value={draft.unit ?? ''} onChange={(e) => setDraft({ ...draft, unit: e.target.value })}>
                {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 sm:mt-5">
              <input type="checkbox" checked={draft.is_dropped} onChange={(e) => setDraft({ ...draft, is_dropped: e.target.checked })} />
              Dropped by NTA
            </label>
          </div>
          <label className="block text-[11px] font-semibold text-slate-600">Explanation
            <textarea rows={3} className={field} value={draft.ai_hint ?? ''} onChange={(e) => setDraft({ ...draft, ai_hint: e.target.value })} />
          </label>
        </div>
      )}

      {message && <p className="text-xs text-slate-600">{message}</p>}

      <div className="flex flex-wrap gap-2 pt-1">
        {editing ? (
          <>
            <button disabled={busy} onClick={save} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white disabled:opacity-50">Save question</button>
            <button disabled={busy} onClick={() => { setDraft(report.question); setEditing(false); }} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300">Cancel</button>
          </>
        ) : (
          <button disabled={busy} onClick={() => setEditing(true)} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-indigo-300 text-indigo-700">Edit question</button>
        )}
        {report.status === 'Resolved' ? (
          <button disabled={busy} onClick={() => setStatus('Open')} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300">Reopen</button>
        ) : (
          <button disabled={busy} onClick={() => setStatus('Resolved')} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white disabled:opacity-50">Mark resolved</button>
        )}
      </div>
    </article>
  );
}

type NoteDraft = { id: string | null; unit: string; title: string; body: string; sort_order: number; status: 'draft' | 'published' };
const EMPTY_NOTE: NoteDraft = { id: null, unit: UNIT_OPTIONS[0].value, title: '', body: '', sort_order: 0, status: 'draft' };

function NotesEditor() {
  const [notes, setNotes] = useState<UnitNote[] | null>(null);
  const [draft, setDraft] = useState<NoteDraft>(EMPTY_NOTE);
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setNotes(await adminListNotes());
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not load notes.');
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (status: 'draft' | 'published') => {
    if (!draft.title.trim() || !draft.body.trim()) { setMsg('Add a title and some text first.'); return; }
    setBusy(true);
    setMsg('');
    try {
      const id = await adminSaveNote({ ...draft, status });
      setDraft({ ...draft, id, status });
      setMsg(status === 'published' ? 'Published: students can see this note now.' : 'Saved as draft (students cannot see it).');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (n: UnitNote) => {
    if (!window.confirm(`Delete the note "${n.title}"? This cannot be undone.`)) return;
    try {
      await adminDeleteNote(n.id);
      if (draft.id === n.id) setDraft(EMPTY_NOTE);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not delete.');
    }
  };

  const field = 'w-full p-2 text-sm border border-slate-300 rounded-lg';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
      <aside className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 self-start">
        <button onClick={() => { setDraft(EMPTY_NOTE); setPreview(false); }} className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-indigo-600 text-white">+ New note</button>
        {notes === null && <p className="text-xs text-slate-500">Loading…</p>}
        {UNIT_OPTIONS.map((u) => {
          const list = (notes ?? []).filter((n) => n.unit === u.value);
          if (list.length === 0) return null;
          return (
            <div key={u.value}>
              <p className="text-[10px] font-bold uppercase text-slate-400 mt-2 mb-1">{u.label}</p>
              {list.map((n) => (
                <div key={n.id} className={`flex items-center gap-1 rounded-lg ${draft.id === n.id ? 'bg-indigo-50' : ''}`}>
                  <button onClick={() => { setDraft(n); setPreview(false); }} className="flex-1 text-left text-xs px-2 py-1.5 truncate">
                    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${n.status === 'published' ? 'bg-emerald-500' : 'bg-amber-400'}`} title={n.status} />
                    {n.title}
                  </button>
                  <button onClick={() => remove(n)} className="text-[10px] text-slate-400 hover:text-rose-600 px-1" aria-label={`Delete ${n.title}`}>✕</button>
                </div>
              ))}
            </div>
          );
        })}
        <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />published · <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />draft (hidden from students)</p>
      </aside>

      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px_90px] gap-2">
          <label className="block text-[11px] font-semibold text-slate-600">Title
            <input className={field} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </label>
          <label className="block text-[11px] font-semibold text-slate-600">Unit
            <select className={field} value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })}>
              {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </label>
          <label className="block text-[11px] font-semibold text-slate-600">Order
            <input type="number" className={field} value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })} />
          </label>
        </div>
        <div className="flex gap-2 text-xs">
          <button onClick={() => setPreview(false)} aria-pressed={!preview} className={`px-3 py-1 rounded-lg border ${!preview ? 'bg-slate-800 text-white' : 'border-slate-300'}`}>Write</button>
          <button onClick={() => setPreview(true)} aria-pressed={preview} className={`px-3 py-1 rounded-lg border ${preview ? 'bg-slate-800 text-white' : 'border-slate-300'}`}>Preview</button>
          <span className="text-slate-400 self-center">Markdown: # heading, - bullet, **bold**, | tables |</span>
        </div>
        {preview ? (
          <div className="border border-slate-200 rounded-lg p-4 min-h-[300px]">
            <MathText html={markdownToHtml(draft.body)} className="note-body text-sm text-slate-800 leading-relaxed" />
          </div>
        ) : (
          <textarea rows={16} className={`${field} font-mono text-xs`} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button disabled={busy} onClick={() => save('draft')} className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 disabled:opacity-50">Save draft</button>
          <button disabled={busy} onClick={() => save('published')} className="px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white disabled:opacity-50">
            {draft.status === 'published' ? 'Save (stays published)' : 'Approve & publish'}
          </button>
          {draft.status === 'published' && draft.id && (
            <button disabled={busy} onClick={() => save('draft')} className="px-3 py-2 text-xs font-bold rounded-lg border border-amber-300 text-amber-800 disabled:opacity-50">Unpublish</button>
          )}
          {msg && <span className="text-xs text-slate-600">{msg}</span>}
        </div>
      </section>
    </div>
  );
}
