"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import AuthModal from '@/components/AuthModal';
import InstructionModal from '@/components/modals/InstructionModal';
import { useAuth } from '@/hooks/useAuth';
import { normalizeQuestion, UNIT_OPTIONS, getCycleDisplayName, getPaperDisplayName } from '@/lib/normalize';
import type { NormalizedQuestion, ExamConfig } from '@/lib/types';

export default function LandingPage() {
  const router = useRouter();
  const { user, checkedSession } = useAuth();

  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [selectedCycle, setSelectedCycle] = useState('ALL');
  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(UNIT_OPTIONS[0].value);
  const [questionCount, setQuestionCount] = useState(5);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<ExamConfig | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/questions');
        const body = await res.json();
        if (!res.ok) {
          setLoadError(body.error || 'Could not load questions.');
        } else {
          const normalized = (body.questions as Parameters<typeof normalizeQuestion>[0][]).map(normalizeQuestion);
          setQuestions(normalized);
        }
      } catch {
        setLoadError('Could not reach the server. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalPapers = useMemo(() => new Set(questions.map((q) => q.paperId)).size, [questions]);

  const cycles = useMemo(() => Array.from(new Set(questions.map((q) => q.cycle))), [questions]);

  const papersForCycle = useMemo(() => {
    const matching = questions.filter((q) => selectedCycle === 'ALL' || q.cycle === selectedCycle);
    return Array.from(new Set(matching.map((q) => q.paperId)));
  }, [questions, selectedCycle]);

  useEffect(() => {
    if (papersForCycle.length > 0 && !papersForCycle.includes(selectedPaperId)) {
      setSelectedPaperId(papersForCycle[0]);
    }
  }, [papersForCycle, selectedPaperId]);

  const fullTestQuestionCount = useMemo(
    () => questions.filter((q) => q.paperId === selectedPaperId).length,
    [questions, selectedPaperId]
  );

  const themeQuestionCount = useMemo(
    () => questions.filter((q) => q.unit === selectedTheme).length,
    [questions, selectedTheme]
  );

  useEffect(() => {
    const max = themeQuestionCount > 0 ? themeQuestionCount : 5;
    setQuestionCount(max);
  }, [themeQuestionCount]);

  const prepareTest = (mode: 'FULL' | 'UNIT') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (mode === 'FULL') {
      setPendingConfig({
        mode: 'FULL',
        paperId: selectedPaperId,
        durationSeconds: 3600,
      });
    } else {
      setPendingConfig({
        mode: 'UNIT',
        theme: selectedTheme,
        questionCount,
        durationSeconds: questionCount * 60,
      });
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
      params.set('count', String(pendingConfig.questionCount || 5));
    }
    setPendingConfig(null);
    router.push(`/quiz?${params.toString()}`);
  };

  const instructionQuestionCount = pendingConfig?.mode === 'FULL' ? fullTestQuestionCount : (pendingConfig?.questionCount || 0);

  return (
    <div className="flex-1 flex flex-col">
      <SiteHeader />

      <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">Official NTA Pattern</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Let&apos;s Master UGC NET Paper 1 PYQs</h2>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">Attempt full-length 60-minute Previous Year Question Paper tests or build custom unit-wise practice sets tailored to your prep strategy.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-xl text-center">
              <span className="block text-2xl font-black text-amber-400">{loading ? '--' : questions.length}</span>
              <span className="text-[11px] text-indigo-200 uppercase font-medium">Total Questions</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-xl text-center">
              <span className="block text-2xl font-black text-amber-400">{loading ? '--' : totalPapers}</span>
              <span className="text-[11px] text-indigo-200 uppercase font-medium">Available Papers</span>
            </div>
          </div>
        </div>

        {loadError && <p className="text-center text-rose-600 text-sm">{loadError}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold mb-4">📝</div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Full Shift Previous Year Question Paper Test</h3>
              <p className="text-xs text-slate-500 mb-4">Complete 50-question simulation of official shift paper under standard exam timing.</p>

              <div className="space-y-3 mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Exam Cycle:</label>
                  <select
                    value={selectedCycle}
                    onChange={(e) => setSelectedCycle(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-600 font-semibold text-slate-800"
                  >
                    <option value="ALL">All Exam Cycles</option>
                    {cycles.map((c) => <option key={c} value={c}>{getCycleDisplayName(c)}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Paper / Shift:</label>
                  <select
                    value={selectedPaperId}
                    onChange={(e) => setSelectedPaperId(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-600 font-semibold text-slate-800"
                  >
                    {papersForCycle.length === 0 && <option value="">No papers available for this cycle</option>}
                    {papersForCycle.map((p) => <option key={p} value={p}>{getPaperDisplayName(p)}</option>)}
                  </select>
                </div>

                <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-200">
                  <span>Questions:</span>
                  <strong className="text-indigo-600 font-bold">{fullTestQuestionCount} Questions</strong>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Timer:</span>
                  <strong className="text-slate-800 font-bold">60 Minutes</strong>
                </div>
              </div>
            </div>
            <button
              onClick={() => prepareTest('FULL')}
              disabled={loading || fullTestQuestionCount === 0}
              className="w-full py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
            >
              Attempt Full Previous Year Question Paper Test
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center font-bold mb-4">🎯</div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Unit-Wise Targeted Practice</h3>
              <p className="text-xs text-slate-500 mb-4">Select a specific theme and configure how many questions you want to solve.</p>
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Theme / Unit:</label>
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Number of Questions:</span>
                    <span className="text-indigo-600 font-bold">{questionCount} Qs</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={Math.max(themeQuestionCount, 5)}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Allocated Time: {questionCount} Minutes (1 min/question)</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => prepareTest('UNIT')}
              disabled={loading || themeQuestionCount === 0}
              className="w-full py-3 bg-amber-500 text-slate-900 font-bold text-sm rounded-xl hover:bg-amber-600 transition shadow-md disabled:opacity-50"
            >
              Start Theme Practice
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
