"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import QuestionPanel from '@/components/quiz/QuestionPanel';
import ReferencePanel from '@/components/quiz/ReferencePanel';
import PaletteDrawer from '@/components/quiz/PaletteDrawer';
import SubmitConfirmModal from '@/components/modals/SubmitConfirmModal';
import ResultModal from '@/components/modals/ResultModal';
import ReportModal from '@/components/modals/ReportModal';
import { useCountdown } from '@/hooks/useCountdown';
import { useStopwatch } from '@/hooks/useStopwatch';
import { normalizeQuestion, getPaperDisplayName } from '@/lib/normalize';
import type { NormalizedQuestion, SubmitResult } from '@/lib/types';

function QuizPageInner() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'UNIT' ? 'UNIT' : 'FULL';
  const paperId = searchParams.get('paperId') || '';
  const theme = searchParams.get('theme') || '';
  const count = Number(searchParams.get('count') || '5');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/questions');
        const body = await res.json();
        if (!res.ok) {
          setLoadError(body.error || 'Could not load questions.');
          setLoading(false);
          return;
        }
        const normalized = (body.questions as Parameters<typeof normalizeQuestion>[0][]).map(normalizeQuestion);
        const filtered = mode === 'FULL'
          ? normalized.filter((q) => q.paperId === paperId)
          : normalized.filter((q) => q.unit === theme).slice(0, count);
        setQuestions(filtered);
      } catch {
        setLoadError('Could not reach the server. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const testMode = mode === 'FULL' ? `Full Test (${getPaperDisplayName(paperId)})` : theme;
  const durationSeconds = mode === 'FULL' ? 3600 : count * 60;

  const [phase, setPhase] = useState<'taking' | 'results'>('taking');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [reviewFlags, setReviewFlags] = useState<boolean[]>([]);
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [reportQuestionId, setReportQuestionId] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [timeTakenSeconds, setTimeTakenSeconds] = useState(0);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    setReviewFlags(new Array(questions.length).fill(false));
  }, [questions.length]);

  const executeSubmission = async (secondsRemaining: number) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setShowSubmitConfirm(false);
    setPhase('results');
    const taken = durationSeconds - secondsRemaining;
    setTimeTakenSeconds(taken);

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIds: questions.map((q) => q.id),
          answers,
          testMode,
          paperId: mode === 'FULL' ? paperId : theme,
          timeTakenSeconds: taken,
        }),
      });
      const body = await res.json();
      if (res.ok) {
        setSubmitResult(body as SubmitResult);
        setShowResultModal(true);
      } else {
        setLoadError(body.error || 'Could not submit test.');
      }
    } catch {
      setLoadError('Could not reach the server to submit your test.');
    }
  };

  const masterSecondsRemaining = useCountdown(durationSeconds, phase === 'taking' && questions.length > 0, () => {
    executeSubmission(0);
  });

  const questionTimeSpent = useStopwatch(currentIndex, phase === 'taking');

  const currentQuestion = questions[currentIndex];
  const answeredFlags = useMemo(() => questions.map((q) => answers[q.id] !== undefined), [questions, answers]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <SiteHeader />
        <p className="text-center text-slate-500 text-sm mt-16">Loading test…</p>
      </div>
    );
  }

  if (loadError && questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <SiteHeader />
        <div className="text-center mt-16">
          <p className="text-rose-600 text-sm mb-4">{loadError}</p>
          <Link href="/" className="text-sm font-bold text-indigo-700 hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <SiteHeader />
        <div className="text-center max-w-md mx-auto mt-16">
          <div className="w-14 h-14 mx-auto bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center text-2xl mb-4 shadow-sm">🚧</div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">No questions found</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">This selection doesn&apos;t have any questions yet. Check back soon.</p>
          <Link href="/" className="text-sm font-bold text-indigo-700 hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <SiteHeader masterSecondsRemaining={masterSecondsRemaining} />

      <div className="flex-1 w-full max-w-[1600px] mx-auto h-[calc(100vh-70px)] overflow-hidden flex flex-col md:flex-row gap-2 p-2 sm:p-4 bg-slate-100">
        <div className="flex-1 flex flex-col md:flex-row gap-2 overflow-hidden relative">
          {currentQuestion.layoutText && <ReferencePanel layoutText={currentQuestion.layoutText} />}

          <QuestionPanel
            question={currentQuestion}
            index={currentIndex}
            total={questions.length}
            timeSpentSeconds={questionTimeSpent[currentIndex] || 0}
            selectedOption={answers[currentQuestion.id] ?? null}
            onSelect={(optIdx) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optIdx }))}
            language={language}
            onToggleLanguage={() => setLanguage((l) => (l === 'EN' ? 'HI' : 'EN'))}
            isReviewed={reviewFlags[currentIndex] || false}
            onToggleReview={() => setReviewFlags((prev) => prev.map((v, i) => (i === currentIndex ? !v : v)))}
            onOpenReport={() => setReportQuestionId(currentQuestion.id)}
            onTogglePalette={() => setPaletteOpen((p) => !p)}
            isSubmitted={phase === 'results'}
            correctOption={submitResult?.answerKey[currentQuestion.id]?.correctOption}
            aiHint={submitResult?.answerKey[currentQuestion.id]?.aiHint}
            onPrev={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
            onNext={() => setCurrentIndex((i) => Math.min(i + 1, questions.length - 1))}
            onClear={() => setAnswers((prev) => {
              const next = { ...prev };
              delete next[currentQuestion.id];
              return next;
            })}
            canGoPrev={currentIndex > 0}
            canGoNext={currentIndex < questions.length - 1}
          />
        </div>

        <div className={paletteOpen ? 'flex flex-col h-full' : 'hidden md:flex md:flex-col h-full'}>
          <PaletteDrawer
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            answeredFlags={answeredFlags}
            reviewFlags={reviewFlags}
            onSelect={(idx) => { setCurrentIndex(idx); setPaletteOpen(false); }}
            onClose={() => setPaletteOpen(false)}
            onSubmit={() => setShowSubmitConfirm(true)}
            isSubmitted={phase === 'results'}
          />
        </div>
      </div>

      {showSubmitConfirm && (
        <SubmitConfirmModal onCancel={() => setShowSubmitConfirm(false)} onConfirm={() => executeSubmission(masterSecondsRemaining)} />
      )}

      {reportQuestionId !== null && (
        <ReportModal questionId={reportQuestionId} onClose={() => setReportQuestionId(null)} />
      )}

      {showResultModal && submitResult && (
        <ResultModal
          correctCount={submitResult.correctCount}
          totalQuestions={submitResult.totalQuestions}
          scorePercentage={submitResult.scorePercentage}
          timeTakenSeconds={timeTakenSeconds}
          saveNote={submitResult.saved ? 'Saved to your attempt history.' : submitResult.loggedIn ? "Couldn't save this attempt to your history." : 'Log in to save your score history.'}
          onClose={() => setShowResultModal(false)}
        />
      )}
    </div>
  );
}

export default function QuizClient() {
  return (
    <Suspense fallback={<p className="text-center text-slate-500 text-sm mt-16">Loading test…</p>}>
      <QuizPageInner />
    </Suspense>
  );
}
