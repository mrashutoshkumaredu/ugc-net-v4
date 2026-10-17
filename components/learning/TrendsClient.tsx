"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { UNIT_OPTIONS, cycleSortKey, getCycleDisplayName } from '@/lib/normalize';
import { normalizeUnit } from '@/lib/scoring';
import { getTrends } from '@/lib/testApi';
import type { Trends } from '@/lib/types';

const unitLabel = (u: string) => UNIT_OPTIONS.find((o) => o.value === normalizeUnit(u))?.label ?? u;
const unitIndex = (u: string) => {
  const i = UNIT_OPTIONS.findIndex((o) => o.value === normalizeUnit(u));
  return i === -1 ? 99 : i;
};

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

  const cycles = useMemo(
    () => Object.keys(data?.papers_per_cycle ?? {}).sort((a, b) => cycleSortKey(b) - cycleSortKey(a)),
    [data]
  );

  // Average questions per paper, so cycles with more papers on the site
  // don't look heavier than they are.
  const grid = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    for (const r of data?.by_unit ?? []) {
      const u = normalizeUnit(r.unit);
      if (!m.has(u)) m.set(u, new Map());
      const papers = data?.papers_per_cycle[r.cycle] || r.papers || 1;
      m.get(u)!.set(r.cycle, (m.get(u)!.get(r.cycle) || 0) + r.questions / papers);
    }
    return Array.from(m.entries()).sort(([a], [b]) => unitIndex(a) - unitIndex(b));
  }, [data]);

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
        <h2 className="text-sm font-bold text-slate-800">Questions per paper, by unit and cycle</h2>
        <p className="text-xs text-slate-500 mb-3">
          Average number of questions from each unit in one 50-question paper. Based on {totalPapers} papers on this site.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[560px]">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left font-semibold py-2 pr-3">Unit</th>
                {cycles.map((c) => (
                  <th key={c} className="text-center font-semibold py-2 px-1.5">
                    {getCycleDisplayName(c).replace(' Cycle', '')}
                    <span className="block font-normal text-[10px] text-slate-400">{data.papers_per_cycle[c]} paper{data.papers_per_cycle[c] > 1 ? 's' : ''}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map(([unit, row]) => (
                <tr key={unit} className="border-t border-slate-100">
                  <td className="py-2 pr-3 font-semibold text-slate-700 whitespace-nowrap">{unitLabel(unit)}</td>
                  {cycles.map((c) => {
                    const v = row.get(c);
                    // One hue, light to dark, for "how many"; 10/paper = darkest.
                    const shade = v === undefined ? 0 : Math.min(1, v / 10);
                    return (
                      <td key={c} className="py-1 px-1 text-center">
                        <span
                          className="inline-block w-full rounded-md py-1.5 font-semibold"
                          style={{
                            background: v === undefined ? 'transparent' : `rgba(79, 70, 229, ${0.08 + shade * 0.62})`,
                            color: shade > 0.55 ? '#ffffff' : '#1e1b4b',
                          }}
                          title={v === undefined ? 'No questions' : `${unitLabel(unit)}, ${getCycleDisplayName(c)}: ${v.toFixed(1)} per paper`}
                        >
                          {v === undefined ? '—' : v.toFixed(1)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">NTA usually asks 5 questions from each unit, so the topic list below says more about where to focus.</p>
      </section>

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
