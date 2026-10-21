'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminListMessages, adminSetMessageStatus, type ContactMessage } from '@/lib/contactApi';

type Filter = 'Open' | 'Resolved' | 'ALL';

// Messages sent through the public Contact page. Plain text only: never rendered as HTML.
export default function MessagesPanel() {
  const [filter, setFilter] = useState<Filter>('Open');
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await adminListMessages(filter === 'ALL' ? null : filter)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load messages.'); }
    finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (m: ContactMessage) => {
    try { await adminSetMessageStatus(m.id, m.status === 'Resolved' ? 'Open' : 'Resolved'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update.'); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-indigo-900">Contact messages</h1>
          <p className="text-xs text-slate-500">Sent from the Contact page. Reply by email, then mark as resolved.</p>
        </div>
        <div className="flex gap-1" role="group" aria-label="Filter messages">
          {(['Open', 'Resolved', 'ALL'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
              className={`px-3 py-1 text-xs font-bold rounded-full border ${filter === f ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white text-slate-600 border-slate-300'}`}>
              {f === 'ALL' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6 text-center">No {filter === 'ALL' ? '' : filter.toLowerCase() + ' '}messages.</p>
      )}
      {items.map((m) => (
        <article key={m.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm">
              <span className="font-bold text-slate-800">{m.name}</span>{' '}
              <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.topic)}`} className="text-indigo-700 hover:underline break-all">{m.email}</a>
            </div>
            <span className="text-[11px] text-slate-400">{new Date(m.created_at).toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{m.topic}</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{m.message}</p>
          <button onClick={() => toggle(m)} className="text-xs font-bold text-slate-600 hover:underline">
            {m.status === 'Resolved' ? 'Reopen' : 'Mark as resolved'}
          </button>
        </article>
      ))}
    </div>
  );
}
