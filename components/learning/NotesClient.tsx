"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import PageShell from '@/components/PageShell';
import { UNIT_OPTIONS } from '@/lib/normalize';
import { markdownToHtml } from '@/lib/markdown';
import { listPublishedNotes } from '@/lib/testApi';
import type { UnitNote } from '@/lib/types';

const MathText = dynamic(() => import('@/components/quiz/MathText'), { ssr: false });

export default function NotesClient() {
  return (
    <PageShell title="Revision Notes" subtitle="Short notes for each Paper 1 unit: key facts, abbreviations and shortcuts to read before a test or the night before the exam." wide>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <NotesBody />
      </Suspense>
    </PageShell>
  );
}

function NotesBody() {
  const router = useRouter();
  const params = useSearchParams();
  const unit = params.get('unit') || UNIT_OPTIONS[0].value;
  const [notes, setNotes] = useState<UnitNote[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listPublishedNotes().then(setNotes).catch((e) => setError(e instanceof Error ? e.message : 'Could not load.'));
  }, []);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const n of notes ?? []) m[n.unit] = (m[n.unit] || 0) + 1;
    return m;
  }, [notes]);
  const shown = (notes ?? []).filter((n) => n.unit === unit);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4">
      <nav aria-label="Units" className="bg-white border border-slate-200 rounded-2xl p-2 self-start">
        {UNIT_OPTIONS.map((u) => (
          <button
            key={u.value}
            onClick={() => router.replace(`/notes?unit=${encodeURIComponent(u.value)}`)}
            aria-current={u.value === unit ? 'page' : undefined}
            className={`w-full text-left text-xs px-2.5 py-2 rounded-lg flex justify-between gap-2 ${u.value === unit ? 'bg-indigo-600 text-white font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <span className="truncate">{u.label}</span>
            <span className={u.value === unit ? 'text-indigo-100' : 'text-slate-400'}>{counts[u.value] || 0}</span>
          </button>
        ))}
      </nav>

      <div className="space-y-4 min-w-0">
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {notes === null && !error && <p className="text-sm text-slate-500">Loading…</p>}
        {notes && shown.length === 0 && (
          <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 text-center">Notes for this unit are being prepared.</p>
        )}
        {shown.map((n) => (
          <article key={n.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg font-bold text-indigo-950 mb-2">{n.title}</h2>
            <MathText html={markdownToHtml(n.body)} className="note-body text-sm text-slate-800 leading-relaxed" />
          </article>
        ))}
      </div>
    </div>
  );
}
