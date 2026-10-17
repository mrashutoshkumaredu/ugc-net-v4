"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import PageShell from '@/components/PageShell';
import SaveToVault from '@/components/learning/SaveToVault';
import { cleanNewlines, CORRECT_MARKS, formatTime, normalizeUnit } from '@/lib/scoring';
import { getPaperDisplayName } from '@/lib/normalize';
import { getReview, listVaultFolders, setMistakeTag } from '@/lib/testApi';
import { MISTAKE_TAGS, type MistakeTag, type ReviewData, type ReviewItem, type VaultFolder } from '@/lib/types';

const MathText = dynamic(() => import('@/components/quiz/MathText'), { ssr: false });

type Filter = 'ALL' | 'WRONG' | 'SKIPPED' | 'GUESSED' | 'CORRECT';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'WRONG', label: 'Wrong' },
  { value: 'SKIPPED', label: 'Skipped' },
  { value: 'GUESSED', label: 'Guessed' },
  { value: 'CORRECT', label: 'Correct' },
];
const OPTION_KEYS = ['option_a', 'option_b', 'option_c', 'option_d'] as const;

function itemState(it: ReviewItem) {
  if (it.question.is_dropped) return 'dropped';
  if (it.chosen === null || it.chosen === undefined) return 'skipped';
  return it.is_correct ? 'correct' : 'wrong';
}

export default function ReviewClient() {
  return (
    <PageShell title="Deep Review" subtitle="Go through every question of this attempt. For each mistake, pick why it happened; your Performance page adds these up so you can see your real weak spots." requireLogin wide>
      <ReviewBody />
    </PageShell>
  );
}

function ReviewBody() {
  const params = useParams<{ id: string }>();
  const submissionId = Number(params.id);
  const [data, setData] = useState<ReviewData | null>(null);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

  useEffect(() => {
    if (!Number.isFinite(submissionId)) { setError('This attempt could not be found.'); return; }
    getReview(submissionId).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Could not load.'));
    listVaultFolders().then(setFolders).catch(() => {});
  }, [submissionId]);

  const items = useMemo(() => data?.items ?? [], [data]);
  const shown = useMemo(() => items.filter((it) => {
    const s = itemState(it);
    if (filter === 'ALL') return true;
    if (filter === 'WRONG') return s === 'wrong';
    if (filter === 'SKIPPED') return s === 'skipped';
    if (filter === 'GUESSED') return it.confidence === 'guess';
    return s === 'correct';
  }), [items, filter]);

  const updateTag = async (it: ReviewItem, tag: MistakeTag | null) => {
    const prev = it.mistake_tag;
    setData((d) => d && { ...d, items: d.items.map((x) => (x.question.id === it.question.id ? { ...x, mistake_tag: tag } : x)) });
    try {
      await setMistakeTag(submissionId, it.question.id, tag);
    } catch {
      setData((d) => d && { ...d, items: d.items.map((x) => (x.question.id === it.question.id ? { ...x, mistake_tag: prev } : x)) });
    }
  };

  if (error) return <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">{error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  const sub = data.submission;
  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-600">
        Deep Review is available for tests taken from 17 October 2026 onwards. This older attempt only has its total score
        ({sub.correct_answers}/{sub.total_questions}).{' '}
        <Link href="/performance" className="font-bold text-indigo-700 hover:underline">Go to Performance</Link>
      </div>
    );
  }

  const counts = {
    WRONG: items.filter((i) => itemState(i) === 'wrong').length,
    SKIPPED: items.filter((i) => itemState(i) === 'skipped').length,
    GUESSED: items.filter((i) => i.confidence === 'guess').length,
    CORRECT: items.filter((i) => itemState(i) === 'correct').length,
    ALL: items.length,
  };
  const untagged = items.filter((i) => itemState(i) === 'wrong' && !i.mistake_tag).length;

  return (
    <div className="space-y-4">
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-800">{sub.test_mode}</p>
          <p className="text-xs text-slate-500">{new Date(sub.submitted_at).toLocaleString('en-IN')} · Time {formatTime(sub.time_taken_seconds)}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold text-indigo-900">{sub.correct_answers * CORRECT_MARKS}/{sub.total_questions * CORRECT_MARKS} marks</p>
          <p className="text-xs text-slate-500">{counts.CORRECT} correct · {counts.WRONG} wrong · {counts.SKIPPED} skipped</p>
        </div>
      </section>

      {untagged > 0 && (
        <p className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
          {untagged} wrong answer{untagged > 1 ? 's have' : ' has'} no reason yet. Pick one under each red question; it takes a second and makes your Performance page far more useful.
        </p>
      )}

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show questions">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${filter === f.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}
          >
            {f.label} ({counts[f.value]})
          </button>
        ))}
      </div>

      {shown.length === 0 && <p className="text-sm text-slate-500">No questions in this group.</p>}

      {shown.map((it) => {
        const q = it.question;
        const state = itemState(it);
        const qIndex = items.indexOf(it) + 1;
        const border = state === 'correct' ? 'border-emerald-300' : state === 'wrong' ? 'border-rose-300' : 'border-slate-200';
        return (
          <article key={q.id} className={`bg-white border-2 ${border} rounded-2xl p-4 sm:p-5 space-y-3`}>
            <header className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-extrabold text-indigo-900 text-sm">Q {qIndex}</span>
                <span className="bg-indigo-50 text-indigo-800 font-semibold px-2 py-0.5 rounded-md">{normalizeUnit(q.unit)}</span>
                <span className="text-slate-400">{getPaperDisplayName(q.paper_id)}{q.question_number ? `, Q${q.question_number}` : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                {it.time_seconds !== null && <span className="text-slate-500">⏱ {formatTime(it.time_seconds)}</span>}
                {it.confidence === 'guess' && <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">Guessed</span>}
                <span className={`px-2 py-0.5 rounded-full ${state === 'correct' ? 'bg-emerald-100 text-emerald-800' : state === 'wrong' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
                  {state === 'correct' ? 'Correct' : state === 'wrong' ? 'Wrong' : state === 'dropped' ? 'Dropped by NTA' : 'Skipped'}
                </span>
              </div>
            </header>

            {q.layout_text && q.layout_text.trim() && (
              <details className="text-sm">
                <summary className="cursor-pointer text-xs font-semibold text-slate-600">Reference material</summary>
                <MathText html={cleanNewlines(q.layout_text)} className="layout-text mt-2 overflow-x-auto text-sm" />
              </details>
            )}
            <MathText html={cleanNewlines(q.question_text)} className="text-sm sm:text-base text-slate-900 whitespace-pre-line leading-relaxed" />

            <ol className="space-y-1.5">
              {OPTION_KEYS.map((k, i) => {
                const isCorrect = i === it.correct_option && !q.is_dropped;
                const isChosen = i === it.chosen;
                const cls = isCorrect ? 'border-emerald-500 bg-emerald-50' : isChosen ? 'border-rose-500 bg-rose-50' : 'border-slate-200';
                return (
                  <li key={k} className={`flex gap-2 items-start p-2.5 rounded-lg border text-sm ${cls}`}>
                    <span className="font-bold text-slate-500">{i + 1}.</span>
                    <MathText html={cleanNewlines(q[k])} className="flex-1" />
                    {isCorrect && <span className="text-[11px] font-bold text-emerald-700 shrink-0">Correct answer</span>}
                    {isChosen && !isCorrect && <span className="text-[11px] font-bold text-rose-700 shrink-0">Your answer</span>}
                  </li>
                );
              })}
            </ol>

            {it.ai_hint && (
              <p className="text-sm text-amber-950 bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg whitespace-pre-line">
                <strong className="block text-xs mb-1">Explanation</strong>{it.ai_hint}
              </p>
            )}

            <footer className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              {(state === 'wrong' || (state === 'correct' && it.confidence === 'guess')) ? (
                <div>
                  <p className="text-[11px] font-bold text-slate-600 mb-1">{state === 'wrong' ? 'Why did you get this wrong?' : 'Lucky guess? What was unclear?'}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MISTAKE_TAGS.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => updateTag(it, it.mistake_tag === t.value ? null : t.value)}
                        aria-pressed={it.mistake_tag === t.value}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition ${it.mistake_tag === t.value ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : <span />}
              <SaveToVault questionId={q.id} folders={folders} onFoldersChange={setFolders} initiallySaved={it.in_vault} />
            </footer>
          </article>
        );
      })}
    </div>
  );
}
