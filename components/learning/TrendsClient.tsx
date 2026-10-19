"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { UNIT_OPTIONS } from '@/lib/normalize';
import { normalizeUnit } from '@/lib/scoring';
import { getTrends } from '@/lib/testApi';
import type { Trends } from '@/lib/types';

const unitLabel = (u: string) => UNIT_OPTIONS.find((o) => o.value === normalizeUnit(u))?.label ?? u;

export default function TrendsClient() {
  return (
    <PageShell
      title="PYQ Trends"
      subtitle="What UGC NET Paper 1 has asked, unit by unit and topic by topic, across the papers on this site. Use it to decide where to spend your revision time."
      wide
    >
      <TrendsBody />
    </PageShell>
  );
}

function TrendsBody() {
  const [data, setData] = useState<Trends | null>(null);
  const [error, setError] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');

  useEffect(() => {
    getTrends().then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Could not load.'));
  }, []);

  const topics = useMemo(() => {
    const list = (data?.by_topic ?? []).filter((t) => unitFilter === 'ALL' || normalizeUnit(t.unit) === unitFilter);
    return [...list].sort((a, b) => b.papers - a.papers || b.questions - a.questions);
  }, [data, unitFilter]);
  const maxPapers = Math.max(1, ...topics.map((t) => t.papers));
  const totalPapers = Object.values(data?.papers_per_cycle ?? {}).reduce((a, b) => a + b, 0);

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Most-asked topics</h2>
            <p className="text-xs text-slate-500">How many papers each topic appeared in, most frequent first.</p>
          </div>
          <select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} aria-label="Filter by unit" className="text-xs border border-slate-300 rounded-lg p-2 bg-white">
            <option value="ALL">All units</option>
            {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
        {data.by_topic.length === 0 ? (
          <p className="text-sm text-slate-500">Topic tags are being added to the questions. This list will appear once they are ready.</p>
        ) : topics.length === 0 ? (
          <p className="text-sm text-slate-500">No topics tagged for this unit yet.</p>
        ) : (
          <ul className="space-y-2">
            {topics.slice(0, 40).map((t) => (
              <li key={`${t.unit}-${t.topic}`} className="text-xs" title={`${t.topic}: ${t.questions} questions in ${t.papers} papers across ${t.cycles} cycles`}>
                <div className="flex justify-between gap-2 mb-1">
                  <span className="text-slate-700 truncate"><strong className="text-slate-900">{t.topic}</strong> <span className="text-slate-400">· {unitLabel(t.unit).replace(/^Unit [IVX]+: /, '')}</span></span>
                  <span className="shrink-0 text-slate-600">{t.papers} of {totalPapers} papers · {t.questions} Qs</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden" aria-hidden>
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(t.papers / maxPapers) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-slate-500">
        Want to practise a weak topic? <Link href="/" className="font-bold text-indigo-700 hover:underline">Start unit-wise practice</Link>.
      </p>
    </div>
  );
}
