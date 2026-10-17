"use client";

// Admin page for student reports. Only emails in the `app_admins` table
// can use it: every database call below checks `is_admin()` on the server,
// so the check here only decides what to show.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import SiteHeader from '@/components/SiteHeader';
import { useAuth } from '@/hooks/useAuth';
import { UNIT_OPTIONS, getPaperDisplayName } from '@/lib/normalize';
import { cleanNewlines } from '@/lib/scoring';
import { adminListReports, adminSetReportStatus, adminUpdateQuestion, isAdmin } from '@/lib/testApi';
import type { AdminReport } from '@/lib/types';

const MathText = dynamic(() => import('@/components/quiz/MathText'), { ssr: false });

type StatusFilter = 'Open' | 'Resolved' | 'ALL';
const OPTION_KEYS = ['option_a', 'option_b', 'option_c', 'option_d'] as const;

export default function AdminClient() {
  const { user, checkedSession } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-indigo-900">Student reports</h1>
            <p className="text-xs text-slate-500">Each report shows the exact question, its paper and its number in that paper, however it was shuffled for the student.</p>
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
