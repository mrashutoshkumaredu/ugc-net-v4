"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import AuthModal from '@/components/AuthModal';
import InstructionModal from '@/components/modals/InstructionModal';
import { useAuth } from '@/hooks/useAuth';
import { UNIT_OPTIONS, getCycleDisplayName, getPaperDisplayName, cycleSortKey } from '@/lib/normalize';
import { normalizeUnit } from '@/lib/scoring';
import { getCatalog } from '@/lib/testApi';
import { getActiveProgress, type SavedProgress } from '@/lib/progress';
import type { Catalog, ExamConfig } from '@/lib/types';

const MAX_UNIT_QUESTIONS = 50;

export default function LandingPage() {
  const router = useRouter();
  const { user, checkedSession } = useAuth();

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [resumable, setResumable] = useState<SavedProgress | null>(null);

  const [selectedCycle, setSelectedCycle] = useState('ALL');
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(UNIT_OPTIONS[0].value);
  const [questionCount, setQuestionCount] = useState(10);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<ExamConfig | null>(null);

  useEffect(() => {
    getCatalog()
      .then(setCatalog)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load questions.'))
      .finally(() => setLoading(false));
    setResumable(getActiveProgress());
  }, []);

  const papers = useMemo(() => catalog?.papers ?? [], [catalog]);

  const cycles = useMemo(
    () => Array.from(new Set(papers.map((p) => p.cycle || 'Unknown'))).sort((a, b) => cycleSortKey(b) - cycleSortKey(a)),
    [papers]
  );

  const papersForCycle = useMemo(
    () => papers.filter((p) => selectedCycle === 'ALL' || (p.cycle || 'Unknown') === selectedCycle),
    [papers, selectedCycle]
  );

  useEffect(() => {
    if (papersForCycle.length > 0 && !papersForCycle.some((p) => p.paper_id === selectedPaperId)) {
      setSelectedPaperId(papersForCycle[0].paper_id);
    }
  }, [papersForCycle, selectedPaperId]);

  const fullTestQuestionCount = papers.find((p) => p.paper_id === selectedPaperId)?.question_count ?? 0;

  const unitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of catalog?.units ?? []) {
      const name = normalizeUnit(u.unit);
      counts[name] = (counts[name] || 0) + u.question_count;
    }
    return counts;
  }, [catalog]);

  const themeQuestionCount = unitCounts[selectedTheme] ?? 0;
  const sliderMax = Math.max(1, Math.min(themeQuestionCount, MAX_UNIT_QUESTIONS));

  useEffect(() => {
    setQuestionCount((c) => Math.min(Math.max(c, 1), sliderMax));
  }, [sliderMax]);

  const prepareTest = (mode: 'FULL' | 'UNIT') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (mode === 'FULL') {
      setPendingConfig({ mode: 'FULL', paperId: selectedPaperId, durationSeconds: 3600 });
    } else {
      setPendingConfig({ mode: 'UNIT', theme: selectedTheme, questionCount, durationSeconds: questionCount * 60 });
    }
  };

  const startExam = () => {
    if (!pendingConfig) return;
    const params = new URLSearchParams();
    params.set('mode', pendingConfig.mode);
    if (pendingConfig.mode === 'FULL') {
      params.set('paperId', pendingConfig.paperId || '');
    } else {
      params.set('theme', pendingConfig.theme || '');
      params.set('count', String(pendingConfig.questionCount || 10));
    }
    setPendingConfig(null);
    router.push(`/quiz?${params.toString()}`);
  };

  const instructionQuestionCount = pendingConfig?.mode === 'FULL' ? fullTestQuestionCount : (pendingConfig?.questionCount || 0);

  return (
    <div className="flex-1 flex flex-col">
      <SiteHeader />

      <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 overflow-y-auto">
        {resumable && user && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-amber-900">You have an unfinished test</p>
              <p className="text-xs text-amber-800">{resumable.label || 'Test in progress'}. The timer has kept running while you were away.</p>
            </div>
            <button
              onClick={() => router.push(`/quiz?session=${resumable.sessionId}`)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-sm rounded-lg shrink-0"
            >
              Resume test
            </button>
          </div>
        )}

        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">Official NTA Pattern</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Let&apos;s Master UGC NET Paper 1 PYQs</h2>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">Attempt full-length 60-minute previous year papers or build unit-wise practice sets. Each correct answer gives 2 marks, with no negative marking.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-xl text-center">
              <span className="block text-2xl font-black text-amber-400">{loading ? '--' : catalog?.total ?? 0}</span>
              <span className="text-[11px] text-indigo-200 uppercase font-medium">Total Questions</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-xl text-center">
              <span className="block text-2xl font-black text-amber-400">{loading ? '--' : papers.length}</span>
              <span className="text-[11px] text-indigo-200 uppercase font-medium">Available Papers</span>
            </div>
          </div>
        </div>

        {loadError && <p className="text-center text-rose-600 text-sm">{loadError}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold mb-4" aria-hidden>📝</div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Full Previous Year Paper</h3>
              <p className="text-xs text-slate-500 mb-4">A complete 50-question shift paper under real exam timing.</p>

              <div className="space-y-3 mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <label className="block text-xs font-semibold text-slate-600">
                  Exam cycle
                  <select
                    value={selectedCycle}
                    onChange={(e) => setSelectedCycle(e.target.value)}
                    className="mt-1 w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-600 font-semibold text-slate-800"
                  >
                    <option value="ALL">All exam cycles</option>
                    {cycles.map((c) => <option key={c} value={c}>{getCycleDisplayName(c)}</option>)}
                  </select>
                </label>

                <label className="block text-xs font-semibold text-slate-600">
                  Paper / shift
                  <select
                    value={selectedPaperId}
                    onChange={(e) => setSelectedPaperId(e.target.value)}
                    className="mt-1 w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-600 font-semibold text-slate-800"
                  >
                    {papersForCycle.length === 0 && <option value="">No papers available for this cycle</option>}
                    {papersForCycle.map((p) => <option key={p.paper_id} value={p.paper_id}>{getPaperDisplayName(p.paper_id)}</option>)}
                  </select>
                </label>

                <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-200">
                  <span>Questions:</span>
                  <strong className="text-indigo-600 font-bold">{fullTestQuestionCount}</strong>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Timer:</span>
                  <strong className="text-slate-800 font-bold">60 minutes</strong>
                </div>
              </div>
            </div>
            <button
              onClick={() => prepareTest('FULL')}
              disabled={loading || fullTestQuestionCount === 0}
              className="w-full py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
            >
              Start Full Paper
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center font-bold mb-4" aria-hidden>🎯</div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Unit-Wise Practice</h3>
              <p className="text-xs text-slate-500 mb-4">Pick a unit and how many questions. You get a fresh random set each time.</p>
              <div className="space-y-3 mb-6">
                <label className="block text-xs font-semibold text-slate-600">
                  Unit
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="mt-1 w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}{unitCounts[u.value] ? ` (${unitCounts[u.value]})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <label htmlFor="question-count">Number of questions:</label>
                    <span className="text-indigo-600 font-bold">{questionCount}</span>
                  </div>
                  <input
                    id="question-count"
                    type="range"
                    min={1}
                    max={sliderMax}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {questionCount} minutes (1 minute per question). Questions on the same passage or table stay together.
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => prepareTest('UNIT')}
              disabled={loading || themeQuestionCount === 0}
              className="w-full py-3 bg-amber-500 text-slate-900 font-bold text-sm rounded-xl hover:bg-amber-600 transition shadow-md disabled:opacity-50"
            >
              Start Unit Practice
            </button>
          </div>
        </div>
      </div>

      {checkedSession && showAuthModal && (
        <AuthModal initialMode="LOGIN" onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
      )}

      {pendingConfig && (
        <InstructionModal
          questionCount={instructionQuestionCount}
          durationMinutes={Math.floor(pendingConfig.durationSeconds / 60)}
          onCancel={() => setPendingConfig(null)}
          onStart={startExam}
        />
      )}
    </div>
  );
}
