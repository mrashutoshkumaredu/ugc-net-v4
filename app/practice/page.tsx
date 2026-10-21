"use client";

import { useEffect, useMemo, useState } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import AuthModal from '@/components/AuthModal';
import InstructionModal from '@/components/modals/InstructionModal';
import { useAuth } from '@/hooks/useAuth';
import { UNIT_OPTIONS, getCycleDisplayName, getPaperDisplayName, cycleSortKey } from '@/lib/normalize';
import { normalizeUnit } from '@/lib/scoring';
import Link from 'next/link';
import { getCatalog, getMyProgress } from '@/lib/testApi';
import { hindiCoverage, usePicturePapers } from '@/lib/hindiImages';
import { clearProgress, getActiveProgress, type SavedProgress } from '@/lib/progress';
import type { Catalog, ExamConfig, Progress } from '@/lib/types';


export default function PracticePage() {
  const router = useRouter();
  const { user, checkedSession } = useAuth();

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const picturePapers = usePicturePapers();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [resumable, setResumable] = useState<SavedProgress | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');

  const [selectedCycle, setSelectedCycle] = useState('ALL');
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(UNIT_OPTIONS[0].value);
  const [questionCount, setQuestionCount] = useState(10);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<ExamConfig | null>(null);
  // Shown from the moment a test is started until the test page takes over.
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    getCatalog()
      .then(setCatalog)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load questions.'))
      .finally(() => setLoading(false));
    setResumable(getActiveProgress());
  }, []);

  useEffect(() => {
    if (!user) { setProgress(null); return; }
    getMyProgress().then(setProgress);
  }, [user]);

  const papers = useMemo(() => catalog?.papers ?? [], [catalog]);

  const cycles = useMemo(
    () => Array.from(new Set(papers.map((p) => p.cycle || 'Unknown'))).sort((a, b) => cycleSortKey(b) - cycleSortKey(a)),
    [papers]
  );

  // Listed by subject code, then name and date, so the order does not depend on how an id was typed.
  const papersForCycle = useMemo(
    () => papers
      .filter((p) => selectedCycle === 'ALL' || (p.cycle || 'Unknown') === selectedCycle)
      .sort((a, b) => getPaperDisplayName(a.paper_id).localeCompare(getPaperDisplayName(b.paper_id), 'en', { numeric: true })),
    [papers, selectedCycle]
  );

  useEffect(() => {
    if (papersForCycle.length > 0 && !papersForCycle.some((p) => p.paper_id === selectedPaperId)) {
      setSelectedPaperId(papersForCycle[0].paper_id);
    }
  }, [papersForCycle, selectedPaperId]);

  const selectedPaper = papers.find((p) => p.paper_id === selectedPaperId);
  const fullTestQuestionCount = selectedPaper?.question_count ?? 0;
  const selectedCoverage = selectedPaper ? hindiCoverage(selectedPaper, picturePapers) : 'NONE';

  const unitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of catalog?.units ?? []) {
      const name = normalizeUnit(u.unit);
      counts[name] = (counts[name] || 0) + u.question_count;
    }
    return counts;
  }, [catalog]);

  const topicsForTheme = useMemo(
    () => (catalog?.topics ?? []).filter((t) => normalizeUnit(t.unit) === selectedTheme).sort((a, b) => a.topic.localeCompare(b.topic)),
    [catalog, selectedTheme]
  );
  useEffect(() => { setSelectedTopic(''); }, [selectedTheme]);

  const themeQuestionCount = selectedTopic
    ? topicsForTheme.find((t) => t.topic === selectedTopic)?.question_count ?? 0
    : unitCounts[selectedTheme] ?? 0;
  // Up to every question in the unit (or topic). The server allows up to 1000 per test.
  const sliderMax = Math.max(1, Math.min(themeQuestionCount, 1000));

  // Only clamp once the counts have loaded; before that sliderMax is 1 and
  // would wrongly pull the default of 10 down to 1.
  useEffect(() => {
    if (themeQuestionCount === 0) return;
    setQuestionCount((c) => Math.min(Math.max(c, 1), sliderMax));
  }, [sliderMax, themeQuestionCount]);

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
      if (selectedTopic) params.set('topic', selectedTopic);
      params.set('count', String(pendingConfig.questionCount || 10));
    }
    setPendingConfig(null);
    setStarting('Starting your test');
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
            {confirmDiscard ? (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-amber-900">Discard this test? Answers will be lost.</span>
                <button
                  onClick={() => { clearProgress(resumable.sessionId); setResumable(null); setConfirmDiscard(false); }}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg"
                >
                  Yes, discard
                </button>
                <button onClick={() => setConfirmDiscard(false)} className="px-3 py-2 bg-white border border-amber-300 text-amber-900 font-bold text-xs rounded-lg">
                  Keep
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { setStarting('Resuming your test'); router.push(`/quiz?session=${resumable.sessionId}`); }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-sm rounded-lg"
                >
                  Resume test
                </button>
                <button
                  onClick={() => setConfirmDiscard(true)}
                  aria-label="Discard unfinished test"
                  title="Discard this test"
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-amber-300 text-amber-900 hover:bg-amber-100 font-bold"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {user && progress && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 sm:col-span-2">
              <div>
                <p className="text-sm font-bold text-slate-800">Daily Practice · 10 questions</p>
                <p className="text-xs text-slate-500">
                  {progress.revisions_due > 0
                    ? `${progress.revisions_due} question${progress.revisions_due > 1 ? 's' : ''} you got wrong ${progress.revisions_due > 1 ? 'are' : 'is'} due for revision, plus new ones from your weakest units.`
                    : 'New questions from your weakest units. Wrong answers come back after 1, 3 and 7 days.'}
                </p>
              </div>
              <button
                onClick={() => { setStarting('Starting Daily Practice'); router.push('/quiz?mode=DAILY'); }}
                className={`px-4 py-2.5 font-bold text-sm rounded-xl shrink-0 ${progress.daily_done ? 'bg-slate-100 text-slate-700 border border-slate-300' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
              >
                {progress.daily_done ? 'Done ✓ · Again' : 'Start'}
              </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-around text-center gap-3">
              <div>
                <p className="text-2xl font-extrabold text-indigo-950">{progress.streak}🔥</p>
                <p className="text-[11px] text-slate-500">day streak</p>
              </div>
              <div>
                {progress.exam_date ? (
                  <>
                    <p className="text-2xl font-extrabold text-indigo-950">
                      {Math.max(0, Math.round((Date.parse(progress.exam_date) - Date.parse(progress.today)) / 86400000))}
                    </p>
                    <p className="text-[11px] text-slate-500">days to exam</p>
                  </>
                ) : (
                  <Link href="/performance" className="text-xs font-bold text-indigo-700 hover:underline">Set your<br />exam date</Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Phones get a short banner so the paper picker and Start button show without scrolling. */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-4 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">Based on the NTA pattern</span>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">Let&apos;s Master UGC NET Paper 1 PYQs</h2>
            <p className="sm:hidden text-xs text-indigo-200">{loading ? 'Loading papers…' : `${catalog?.total ?? 0} questions · ${papers.length} papers · 2 marks each, no negative marking`}</p>
            <p className="hidden sm:block text-xs sm:text-sm text-indigo-200 leading-relaxed">Attempt full-length 60-minute previous year papers or build unit-wise practice sets. Each correct answer gives 2 marks, with no negative marking.</p>
          </div>
          <div className="hidden sm:grid grid-cols-2 gap-3 w-full md:w-auto shrink-0">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pb-12">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="hidden sm:flex w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl items-center justify-center font-bold mb-4" aria-hidden>📝</div>
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
                    {papersForCycle.map((p) => <option key={p.paper_id} value={p.paper_id}>{getPaperDisplayName(p.paper_id)}{hindiCoverage(p, picturePapers) === 'FULL' ? ' · English + हिंदी' : ''}</option>)}
                  </select>
                </label>

                {selectedPaper && (
                  <p className={`text-[11px] font-bold rounded-lg px-2.5 py-1.5 ${selectedCoverage === 'FULL' ? 'bg-emerald-50 text-emerald-800' : selectedCoverage === 'PARTIAL' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                    {selectedCoverage === 'FULL' && 'Available in English and Hindi (हिंदी). Switch language during the test.'}
                    {selectedCoverage === 'PARTIAL' && `Hindi (हिंदी) available for ${selectedPaper.hindi_text_count} of ${selectedPaper.question_count} questions.`}
                    {selectedCoverage === 'NONE' && 'English only. Hindi is not available for this paper yet.'}
                  </p>
                )}
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

          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="hidden sm:flex w-10 h-10 bg-amber-100 text-amber-800 rounded-xl items-center justify-center font-bold mb-4" aria-hidden>🎯</div>
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
                {topicsForTheme.length > 0 && (
                  <label className="block text-xs font-semibold text-slate-600">
                    Topic (optional)
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="mt-1 w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">All topics in this unit</option>
                      {topicsForTheme.map((t) => <option key={t.topic} value={t.topic}>{t.topic} ({t.question_count})</option>)}
                    </select>
                  </label>
                )}
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
              className="w-full py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
            >
              Start Unit Practice
            </button>
          </div>
        </div>
      </div>

      {checkedSession && showAuthModal && (
        <AuthModal initialMode="LOGIN" onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />
      )}

      {starting && <LoadingScreen message={starting} />}

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
