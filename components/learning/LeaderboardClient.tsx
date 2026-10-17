"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { cycleSortKey, getCycleDisplayName, getPaperDisplayName } from '@/lib/normalize';
import { formatTime } from '@/lib/scoring';
import { getCatalog, getLeaderboard } from '@/lib/testApi';
import type { Catalog, LeaderboardRow } from '@/lib/types';

export default function LeaderboardClient() {
  return (
    <PageShell
      title="Leaderboard"
      subtitle="Only each student's first attempt at a full paper counts, so retakes after seeing the answers don't change the ranking. Names show as first name + initial; you can hide yourself on your Performance page."
      requireLogin
    >
      <LeaderboardBody />
    </PageShell>
  );
}

function LeaderboardBody() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [paperId, setPaperId] = useState<string>('OVERALL');
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { getCatalog().then(setCatalog).catch(() => {}); }, []);

  useEffect(() => {
    setRows(null);
    setError('');
    getLeaderboard(paperId === 'OVERALL' ? null : paperId)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load.'));
  }, [paperId]);

  const groups = useMemo(() => {
    const byCycle = new Map<string, string[]>();
    for (const p of catalog?.papers ?? []) {
      const c = p.cycle || 'Unknown';
      byCycle.set(c, [...(byCycle.get(c) ?? []), p.paper_id]);
    }
    return Array.from(byCycle.entries()).sort(([a], [b]) => cycleSortKey(b) - cycleSortKey(a));
  }, [catalog]);

  const overall = paperId === 'OVERALL';

  return (
    <div className="space-y-4">
      <label className="block text-xs font-semibold text-slate-600 max-w-md">
        Board
        <select value={paperId} onChange={(e) => setPaperId(e.target.value)} className="mt-1 w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5">
          <option value="OVERALL">Overall: average of first attempts (3+ papers)</option>
          {groups.map(([cycle, ids]) => (
            <optgroup key={cycle} label={getCycleDisplayName(cycle)}>
              {ids.map((id) => <option key={id} value={id}>{getPaperDisplayName(id)}</option>)}
            </optgroup>
          ))}
        </select>
      </label>

      {error && <p className="text-sm text-rose-600">{error}</p>}
      {rows === null && !error && <p className="text-sm text-slate-500">Loading…</p>}
      {rows && rows.length === 0 && (
        <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-6 text-center">
          {overall ? 'No one has finished 3 full papers yet.' : 'No first attempts on this paper yet.'}{' '}
          <Link href="/" className="font-bold text-indigo-700 hover:underline">Take a full paper</Link>
        </p>
      )}
      {rows && rows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="text-left px-4 py-2 w-16">Rank</th>
                <th className="text-left px-4 py-2">Student</th>
                <th className="text-right px-4 py-2">{overall ? 'Average' : 'Score'}</th>
                <th className="text-right px-4 py-2 hidden sm:table-cell">{overall ? 'Papers' : 'Time'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.rank}-${i}`} className={`border-t border-slate-100 ${r.is_me ? 'bg-indigo-50 font-bold' : ''}`}>
                  <td className="px-4 py-2.5">{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</td>
                  <td className="px-4 py-2.5">{r.name}{r.is_me && <span className="ml-2 text-[11px] text-indigo-700">(you)</span>}</td>
                  <td className="px-4 py-2.5 text-right">{r.score}%</td>
                  <td className="px-4 py-2.5 text-right hidden sm:table-cell text-slate-600">
                    {overall ? r.papers : r.time_seconds !== undefined ? formatTime(r.time_seconds) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
