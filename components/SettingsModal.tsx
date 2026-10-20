"use client";

import { useEffect, useState } from 'react';
import { getMyProgress, saveMySettings } from '@/lib/testApi';

// Exam date and leaderboard choice, opened from the profile ("A") menu.
export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [show, setShow] = useState(true);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMyProgress()
      .then((p) => {
        if (p) { setExamDate(p.exam_date ?? ''); setShow(p.show_on_leaderboard); }
      })
      .catch(() => setMsg('Could not load your settings.'))
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    setMsg('');
    setBusy(true);
    try {
      await saveMySettings(examDate || null, show);
      setMsg('Saved.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="settings-title" className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-slate-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h2 id="settings-title" className="text-lg font-bold text-indigo-900">Settings</h2>
          <button onClick={onClose} aria-label="Close settings" className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        {!loaded ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            <label className="block text-sm font-semibold text-slate-700">
              My exam date
              <span className="block text-xs font-normal text-slate-500">Used for the countdown on the Today page.</span>
              <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="mt-1.5 block w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="flex items-start gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" className="mt-1" checked={show} onChange={(e) => setShow(e.target.checked)} />
              <span>Show me on the leaderboard <span className="block text-xs font-normal text-slate-500">As your first name and initial only.</span></span>
            </label>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={save} disabled={busy} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
              {msg && <span className="text-sm text-slate-600" role="status">{msg}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
