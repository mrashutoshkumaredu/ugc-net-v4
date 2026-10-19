"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import AuthModal from '@/components/AuthModal';
import QuestionPanel, { type TextSize } from '@/components/quiz/QuestionPanel';
import ReferencePanel from '@/components/quiz/ReferencePanel';
import PaletteDrawer, { type ResultState, type ReviewFilter } from '@/components/quiz/PaletteDrawer';
import SubmitConfirmModal from '@/components/modals/SubmitConfirmModal';
import ResultModal from '@/components/modals/ResultModal';
import ReportModal from '@/components/modals/ReportModal';
import { useAuth } from '@/hooks/useAuth';
import { useCountdown } from '@/hooks/useCountdown';
import { useStopwatch } from '@/hooks/useStopwatch';
import { normalizeQuestion, getPaperDisplayName } from '@/lib/normalize';
import { testTitle } from '@/lib/testTitle';
import { useHindiImages } from '@/lib/hindiImages';
import { preloadImages } from '@/components/quiz/HindiImage';
import { startTest, resumeTest, submitTest } from '@/lib/testApi';
import { clearProgress, loadProgress, saveProgress } from '@/lib/progress';
import type { NormalizedQuestion, SubmitResult, TestSession } from '@/lib/types';

type LoadState = 'auth' | 'loading' | 'ready' | 'error' | 'finished';

const isDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

function QuizPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get('session');
  const { user, checkedSession } = useAuth();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState('');
  const [session, setSession] = useState<TestSession | null>(null);
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [endAtMs, setEndAtMs] = useState<number | null>(null);

  const [phase, setPhase] = useState<'taking' | 'submitting' | 'results'>('taking');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [reviewFlags, setReviewFlags] = useState<Record<number, boolean>>({});
  const [confidence, setConfidence] = useState<Record<number, 'guess'>>({});
  const [visited, setVisited] = useState<Record<number, boolean>>({});
  // Seconds spent per question id, carried over from a saved session.
  const [savedTime, setSavedTime] = useState<Record<number, number>>({});
  const timeByQuestionRef = useRef<Record<number, number>>({});
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');
  // Phones: the palette opens as an overlay. Larger screens: it sits beside
  // the question and the ☰ button hides or shows it.
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteHiddenDesktop, setPaletteHiddenDesktop] = useState(false);
  const [textSize, setTextSizeState] = useState<TextSize>('md');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [reportQuestionId, setReportQuestionId] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('ALL');
  const startedRef = useRef(false);
  const submittingRef = useRef(false);

  const label = session
    ? session.label
      || (session.mode === 'FULL'
        ? `Full Test (${getPaperDisplayName(session.paper_id || '')})`
        : `${session.unit} (${questions.length} Qs)`)
    : '';
  const title = testTitle(session, questions.length);
  const hindiImages = useHindiImages();
  // When the student switches to Hindi, fetch all of this test's Hindi pictures in the
  // background, so moving to the next question shows its picture straight away.
  useEffect(() => {
    if (language !== 'HI' || questions.length === 0) return;
    const srcs = new Set<string>();
    for (const q of questions) {
      const img = hindiImages[String(q.id)];
      if (img) { srcs.add(img.q); if (img.ref) srcs.add(img.ref); }
    }
    preloadImages([...srcs]);
  }, [language, questions, hindiImages]);

  // ---- Load: resume an existing session, or start a new one --------------
  const applySession = useCallback((s: TestSession) => {
    // The end time is set by the server's clock; convert it to this device's
    // clock so a wrong phone clock can't add or remove time.
    const offset = Date.parse(s.server_now) - Date.now();
    setEndAtMs(Date.parse(s.started_at) + s.duration_seconds * 1000 - offset);
    setSession(s);
    setQuestions(s.questions.map(normalizeQuestion));
    const saved = loadProgress(s.session_id);
    if (saved) {
      setAnswers(saved.answers || {});
      setReviewFlags(saved.reviewFlags || {});
      setCurrentIndex(Math.min(saved.currentIndex || 0, Math.max(s.questions.length - 1, 0)));
      setLanguage(saved.language || 'EN');
      setConfidence(saved.confidence || {});
      setVisited(saved.visited || {});
      setSavedTime(saved.timeSpent || {});
    }
    setLoadState('ready');
  }, []);

  useEffect(() => {
    if (!checkedSession) return;
    if (!user) {
      setLoadState('auth');
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      setLoadState('loading');
      try {
        if (sessionParam) {
          const s = await resumeTest(sessionParam);
          if (!s) {
            clearProgress(sessionParam);
            setLoadState('finished');
            return;
          }
          applySession(s);
          return;
        }
        const m = searchParams.get('mode');
        const mode = m === 'UNIT' || m === 'VAULT' || m === 'DAILY' ? m : 'FULL';
        const s = await startTest(mode, {
          paperId: searchParams.get('paperId') || undefined,
          unit: searchParams.get('theme') || undefined,
          topic: searchParams.get('topic') || undefined,
          folderId: searchParams.get('folder') || undefined,
          count: Number(searchParams.get('count') || '10'),
        });
        // Put the session id in the address so a refresh resumes this test.
        router.replace(`/quiz?session=${s.session_id}`);
        applySession(s);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Could not load the test.');
        setLoadState('error');
      }
    };
    run();
  }, [checkedSession, user, sessionParam, searchParams, router, applySession]);

  // ---- Text size (remembered on this device) and full screen -------------
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('ugcnet.textSize');
      if (saved === 'sm' || saved === 'md' || saved === 'lg') setTextSizeState(saved);
    } catch {
      // storage unavailable
    }
    setCanFullscreen(Boolean(document.fullscreenEnabled));
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const setTextSize = useCallback((size: TextSize) => {
    setTextSizeState(size);
    try {
      window.localStorage.setItem('ugcnet.textSize', size);
    } catch {
      // storage unavailable
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  const togglePalette = useCallback(() => {
    if (isDesktop()) setPaletteHiddenDesktop((h) => !h);
    else setPaletteOpen((p) => !p);
  }, []);

  const questionTimeSpent = useStopwatch(currentIndex, loadState === 'ready' && phase === 'taking');
  // Seconds per question id = time saved before a refresh + time this visit.
  useEffect(() => {
    const merged: Record<number, number> = { ...savedTime };
    questions.forEach((q, i) => {
      merged[q.id] = (savedTime[q.id] || 0) + (questionTimeSpent[i] || 0);
    });
    timeByQuestionRef.current = merged;
  }, [questions, questionTimeSpent, savedTime]);

  // ---- Save progress on this device after every change --------------------
  useEffect(() => {
    if (!session || phase !== 'taking') return;
    saveProgress({
      sessionId: session.session_id,
      label,
      answers,
      reviewFlags,
      currentIndex,
      language,
      confidence,
      visited,
      timeSpent: timeByQuestionRef.current,
      savedAt: Date.now(),
    });
    // questionTimeSpent changes every second, so time per question is kept too.
  }, [session, phase, label, answers, reviewFlags, currentIndex, language, confidence, visited, questionTimeSpent]);

  // Mark the question on screen as visited (NTA "Not Answered" once seen).
  useEffect(() => {
    const q = questions[currentIndex];
    if (!q || phase !== 'taking') return;
    setVisited((v) => (v[q.id] ? v : { ...v, [q.id]: true }));
  }, [questions, currentIndex, phase]);

  // ---- Submit ---------------------------------------------------------------
  const executeSubmission = useCallback(async () => {
    if (!session || submittingRef.current) return;
    submittingRef.current = true;
    setShowSubmitConfirm(false);
    setSubmitError('');
    setPhase('submitting');
    try {
      const meta: Record<number, { conf?: 'guess'; t?: number }> = {};
      for (const q of questions) {
        const t = Math.round(timeByQuestionRef.current[q.id] || 0);
        if (t > 0 || confidence[q.id]) meta[q.id] = { ...(confidence[q.id] ? { conf: 'guess' as const } : {}), ...(t > 0 ? { t } : {}) };
      }
      const result = await submitTest(session.session_id, answers, meta);
      clearProgress(session.session_id);
      setSubmitResult(result);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setPhase('results');
      setShowResultModal(true);
      setCurrentIndex(0);
    } catch (err) {
      submittingRef.current = false;
      setPhase('taking');
      setSubmitError(err instanceof Error ? err.message : 'Could not submit the test.');
    }
  }, [session, answers, questions, confidence]);

  const secondsRemaining = useCountdown(endAtMs, loadState === 'ready' && phase === 'taking', () => {
    executeSubmission();
  });

  const currentQuestion = questions[currentIndex];
  const isSubmitted = phase === 'results';
  const answeredFlags = useMemo(() => questions.map((q) => answers[q.id] !== undefined), [questions, answers]);
  const reviewFlagList = useMemo(() => questions.map((q) => Boolean(reviewFlags[q.id])), [questions, reviewFlags]);
  const visitedFlagList = useMemo(() => questions.map((q) => Boolean(visited[q.id])), [questions, visited]);
  const resultStates = useMemo<ResultState[] | undefined>(() => {
    if (!submitResult) return undefined;
    return questions.map((q) => {
      const key = submitResult.answerKey[q.id];
      if (key?.isDropped && !(key.correctOption >= 0)) return 'dropped';
      if (answers[q.id] === undefined) return 'skipped';
      return answers[q.id] === key?.correctOption ? 'correct' : 'wrong';
    });
  }, [submitResult, questions, answers]);

  const selectOption = useCallback((optIdx: number) => {
    if (!currentQuestion || phase !== 'taking') return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optIdx }));
  }, [currentQuestion, phase]);
  const clearAnswer = useCallback(() => {
    if (!currentQuestion || phase !== 'taking') return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });
    setConfidence((prev) => {
      if (!prev[currentQuestion.id]) return prev;
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });
  }, [currentQuestion, phase]);
  const toggleReview = useCallback(() => {
    if (!currentQuestion || phase !== 'taking') return;
    setReviewFlags((prev) => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }));
  }, [currentQuestion, phase]);
  const toggleConfidence = useCallback(() => {
    if (!currentQuestion || phase !== 'taking' || answers[currentQuestion.id] === undefined) return;
    setConfidence((prev) => {
      const next = { ...prev };
      if (next[currentQuestion.id]) delete next[currentQuestion.id];
      else next[currentQuestion.id] = 'guess';
      return next;
    });
  }, [currentQuestion, phase, answers]);
  const goPrev = useCallback(() => setCurrentIndex((i) => Math.max(i - 1, 0)), []);
  const goNext = useCallback(() => setCurrentIndex((i) => Math.min(i + 1, questions.length - 1)), [questions.length]);
  const markAndNext = useCallback(() => {
    if (!currentQuestion || phase !== 'taking') return;
    setReviewFlags((prev) => ({ ...prev, [currentQuestion.id]: true }));
    goNext();
  }, [currentQuestion, phase, goNext]);

  // ---- Keyboard shortcuts: all while taking the test, only ← → when viewing answers ----
  useEffect(() => {
    if (loadState !== 'ready' || (phase !== 'taking' && phase !== 'results')) return;
    const onKey = (e: KeyboardEvent) => {
      if (showSubmitConfirm || reportQuestionId !== null) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (phase === 'results') {
        if (e.key === 'ArrowRight') goNext();
        else if (e.key === 'ArrowLeft') goPrev();
        return;
      }
      switch (e.key.toLowerCase()) {
        case '1': case '2': case '3': case '4':
          selectOption(Number(e.key) - 1); break;
        case 'arrowright': goNext(); break;
        case 'arrowleft': goPrev(); break;
        case 'm': toggleReview(); break;
        case 'g': toggleConfidence(); break;
        case 'backspace': case 'delete': e.preventDefault(); clearAnswer(); break;
        default: return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loadState, phase, showSubmitConfirm, reportQuestionId, selectOption, goNext, goPrev, toggleReview, toggleConfidence, clearAnswer]);

  // ---- Screens other than the test itself ----------------------------------
  if (!checkedSession || loadState === 'loading') {
    return (
      <div className="flex-1 flex flex-col">
        <SiteHeader />
        <LoadingScreen />
      </div>
    );
  }

  if (loadState === 'auth') {
    return (
      <div className="flex-1 flex flex-col">
        <SiteHeader />
        <div className="text-center max-w-md mx-auto mt-16 px-4">
          <h1 className="text-xl font-bold text-slate-800 mb-2">Please log in to take this test</h1>
          <p className="text-sm text-slate-500 mb-4">Log in or create a free account. Your scores and history are saved to your account.</p>
          <Link href="/" className="text-sm font-bold text-indigo-700 hover:underline">← Back to Home</Link>
        </div>
        <AuthModal initialMode="LOGIN" onClose={() => router.push('/')} onSuccess={() => { /* useAuth picks up the session */ }} />
      </div>
    );
  }

  if (loadState === 'finished') {
    return (
      <div className="flex-1 flex flex-col">
        <SiteHeader />
        <div className="text-center max-w-md mx-auto mt-16 px-4">
          <h1 className="text-xl font-bold text-slate-800 mb-2">This test is already submitted</h1>
          <p className="text-sm text-slate-500 mb-4">You can see the score in My History, or start a new test from the home page.</p>
          <Link href="/" className="text-sm font-bold text-indigo-700 hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  if (loadState === 'error' || !currentQuestion) {
    return (
      <div className="flex-1 flex flex-col">
        <SiteHeader />
        <div className="text-center max-w-md mx-auto mt-16 px-4">
          <p className="text-rose-600 text-sm mb-4">{loadError || 'This selection has no questions yet.'}</p>
          <Link href="/" className="text-sm font-bold text-indigo-700 hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const showSource = session?.mode === 'UNIT';
  const referenceText = language === 'HI' && currentQuestion.layoutTextHi ? currentQuestion.layoutTextHi : currentQuestion.layoutText;
  // Hindi picture of the question / table / passage, used only when there is no typed Hindi text.
  const hindiImage = hindiImages[String(currentQuestion.id)];
  const hasHindiText = Boolean(currentQuestion.questionTextHi || currentQuestion.optionsHi?.some(Boolean));
  const hindiRefImage = language === 'HI' && !hasHindiText && !currentQuestion.layoutTextHi ? hindiImage?.ref : undefined;
  const showingHindiPicture = language === 'HI' && !hasHindiText && Boolean(hindiImage);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <SiteHeader masterSecondsRemaining={phase === 'results' ? undefined : secondsRemaining} />

      {(submitError || phase === 'submitting') && (
        <div className={`text-center text-xs font-semibold py-2 px-4 ${submitError ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'}`} role="status">
          {submitError ? `${submitError} Your answers are still here; please try submitting again.` : 'Submitting your test…'}
        </div>
      )}

      <div className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto overflow-hidden flex flex-col gap-2 p-2 sm:p-4 bg-slate-100">
        {title && (
          <div className="shrink-0 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold text-indigo-900 truncate" title={title}>
            {title}
          </div>
        )}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-2 overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row gap-2 overflow-hidden relative">
          {/* In Hindi-picture mode the picture already holds the lists and options (match-the-list),
              so the English reference table is shown only when there is a Hindi table/passage picture. */}
          {referenceText && !(showingHindiPicture && !hindiRefImage) && (
            <ReferencePanel layoutText={referenceText} imageSrc={hindiRefImage} textSize={textSize} />
          )}

          <QuestionPanel
            question={currentQuestion}
            index={currentIndex}
            total={questions.length}
            showSource={showSource}
            timeSpentSeconds={questionTimeSpent[currentIndex] || 0}
            selectedOption={answers[currentQuestion.id] ?? null}
            onSelect={selectOption}
            language={language}
            onToggleLanguage={() => setLanguage((l) => (l === 'EN' ? 'HI' : 'EN'))}
            isReviewed={Boolean(reviewFlags[currentQuestion.id])}
            onToggleReview={toggleReview}
            onMarkAndNext={markAndNext}
            onSubmitRequest={() => setShowSubmitConfirm(true)}
            confidence={answers[currentQuestion.id] === undefined ? null : confidence[currentQuestion.id] ? 'guess' : 'sure'}
            onToggleConfidence={toggleConfidence}
            onOpenReport={() => setReportQuestionId(currentQuestion.id)}
            onTogglePalette={togglePalette}
            paletteVisible={paletteOpen || !paletteHiddenDesktop}
            textSize={textSize}
            onTextSize={setTextSize}
            canFullscreen={canFullscreen}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            isSubmitted={isSubmitted}
            correctOption={submitResult?.answerKey[currentQuestion.id]?.correctOption}
            aiHint={submitResult?.answerKey[currentQuestion.id]?.aiHint}
            onPrev={goPrev}
            onNext={goNext}
            onClear={clearAnswer}
            hindiImage={hindiImage?.q}
            canGoPrev={currentIndex > 0}
            canGoNext={currentIndex < questions.length - 1}
          />
        </div>

        <div className={paletteOpen ? 'flex flex-col h-full' : paletteHiddenDesktop ? 'hidden' : 'hidden md:flex md:flex-col h-full'}>
          <PaletteDrawer
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            answeredFlags={answeredFlags}
            reviewFlags={reviewFlagList}
            visitedFlags={visitedFlagList}
            onSelect={(idx) => { setCurrentIndex(idx); setPaletteOpen(false); }}
            onClose={() => { if (isDesktop()) setPaletteHiddenDesktop(true); setPaletteOpen(false); }}
            onSubmit={() => setShowSubmitConfirm(true)}
            isSubmitted={isSubmitted || phase === 'submitting'}
            resultStates={resultStates}
            filter={reviewFilter}
            onFilterChange={setReviewFilter}
          />
        </div>
        </div>
      </div>

      {showSubmitConfirm && (
        <SubmitConfirmModal
          unansweredCount={questions.length - answeredFlags.filter(Boolean).length}
          onCancel={() => setShowSubmitConfirm(false)}
          onConfirm={executeSubmission}
        />
      )}

      {reportQuestionId !== null && (
        <ReportModal questionId={reportQuestionId} onClose={() => setReportQuestionId(null)} />
      )}

      {showResultModal && submitResult && (
        <ResultModal
          correctCount={submitResult.correctCount}
          totalQuestions={submitResult.totalQuestions}
          droppedCount={submitResult.droppedCount || 0}
          scorePercentage={submitResult.scorePercentage}
          timeTakenSeconds={submitResult.timeTakenSeconds}
          unitBreakdown={submitResult.unitBreakdown}
          saved={submitResult.saved}
          reviewHref={submitResult.submissionId ? `/review/${submitResult.submissionId}` : undefined}
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
