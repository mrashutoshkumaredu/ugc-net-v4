"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import AuthModal from '@/components/AuthModal';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/hooks/useAuth';
import { getMyProgress } from '@/lib/testApi';
import { clearProgress, getActiveProgress, type SavedProgress } from '@/lib/progress';
import { classesApi, taskHref, type ClassTask } from '@/lib/classesApi';
import { courseApi, type CourseChapter, type CourseSet } from '@/lib/courseApi';
import type { Progress } from '@/lib/types';

// Today: the one page that answers "what should I do now?".
export default function TodayClient() {
  const router = useRouter();
  const { user, checkedSession } = useAuth();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [resumable, setResumable] = useState<SavedProgress | null>(null);
  const [tasks, setTasks] = useState<(ClassTask & { class_name: string })[]>([]);
  const [course, setCourse] = useState<{ chapters: CourseChapter[]; sets: CourseSet[] } | null>(null);
  const [auth, setAuth] = useState<'LOGIN' | 'REGISTER' | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => { setResumable(getActiveProgress()); courseApi.catalog().then(setCourse).catch(() => {}); }, []);
  useEffect(() => {
    if (!user) { setProgress(null); setTasks([]); return; }
    getMyProgress().then(setProgress).catch(() => {});
    classesApi.mine().then((m) => setTasks(m.tasks.filter((t) => !t.result))).catch(() => {});
  }, [user]);

  const go = (msg: string, href: string) => { setStarting(msg); router.push(href); };
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const first = ((user?.user_metadata?.full_name as string | undefined) || '').split(' ')[0];
  const days = progress?.exam_date ? Math.max(0, Math.round((Date.parse(progress.exam_date) - Date.parse(progress.today)) / 86400000)) : null;

  // Next chapter: the first chapter with a practice set not tried yet.
  const diag = course?.sets.find((s) => s.kind === 'diagnostic');
  const nextChapter = course?.chapters.find((c) => course.sets.some((s) => s.chapter_no === c.no && s.best === null));

  return (
    <div className="flex-1 flex flex-col">
      <SiteHeader />
      <main className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Greeting */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <span className="absolute -right-6 -bottom-10 text-[140px] opacity-10" aria-hidden>📚</span>
          <p className="text-sm text-indigo-200 font-semibold">{hello}{first ? `, ${first}` : ''} 👋</p>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">{user ? 'Here is your plan for today' : 'Crack UGC NET Paper 1, one day at a time'}</h1>
          {user && progress ? (
            <div className="flex gap-6 mt-4">
              <div><p className="text-3xl font-black">{progress.streak}🔥</p><p className="text-xs text-indigo-200">day streak</p></div>
              {days !== null ? (
                <div><p className="text-3xl font-black">{days}</p><p className="text-xs text-indigo-200">days to exam</p></div>
              ) : (
                <Link href="/performance" className="btn btn-light btn-sm self-center">🎯 Set your exam date</Link>
              )}
            </div>
          ) : !user && checkedSession ? (
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => setAuth('REGISTER')} className="btn btn-lg bg-white text-indigo-900 hover:bg-indigo-50 shadow-sm">Create free account</button>
              <button onClick={() => setAuth('LOGIN')} className="btn btn-light btn-lg">Log in</button>
            </div>
          ) : null}
        </div>

        {/* Priority cards */}
        <div className="space-y-3">
          {resumable && user && (
            <Card tone="amber" icon="⏯" title="Finish your unfinished test" text={`${resumable.label || 'Test in progress'}. The timer has kept running.`}>
              <button onClick={() => go('Resuming your test', `/quiz?session=${resumable.sessionId}`)} className="btn btn-primary">Resume</button>
              <button onClick={() => { clearProgress(resumable.sessionId); setResumable(null); }} className="btn btn-ghost btn-sm" title="Discard this test">Discard</button>
            </Card>
          )}

          {tasks.length > 0 && (
            <Card tone="violet" icon="📋" title={`${tasks.length} class task${tasks.length > 1 ? 's' : ''} to do`} text={tasks.slice(0, 3).map((t) => `${t.title}${t.due_on ? ` (due ${new Date(t.due_on + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})` : ''}`).join(' · ')}>
              <Link href={taskHref(tasks[0])} className="btn btn-primary">Start next</Link>
              <Link href="/classes" className="btn btn-ghost btn-sm">All tasks</Link>
            </Card>
          )}

          {user && progress && (
            <Card tone="emerald" icon={progress.daily_done ? '✅' : '🎯'} title={progress.daily_done ? 'Daily Practice done. Well done!' : 'Daily Practice · 10 questions'}
              text={progress.revisions_due > 0 ? `${progress.revisions_due} question${progress.revisions_due > 1 ? 's' : ''} you got wrong ${progress.revisions_due > 1 ? 'are' : 'is'} due for revision, plus new ones from your weakest units.` : 'New questions from your weakest units. Wrong answers come back after 1, 3 and 7 days.'}>
              <button onClick={() => go('Starting Daily Practice', '/quiz?mode=DAILY')} className={`btn ${progress.daily_done ? 'btn-secondary' : 'btn-primary'}`}>{progress.daily_done ? 'Again' : 'Start'}</button>
            </Card>
          )}

          {diag && diag.best === null ? (
            <Card tone="teal" icon="🩺" title="Find your weak chapters" text={`Free Diagnostic Test: ${diag.questions} questions, one from each maths chapter.`}>
              <Link href={`/course?set=${diag.id}`} className="btn btn-primary">Take it</Link>
            </Card>
          ) : nextChapter ? (
            <Card tone="teal" icon="📘" title={`Next chapter: ${nextChapter.title}`} text={nextChapter.subtitle || 'Continue the Maths Course.'}>
              <Link href={`/course?ch=${nextChapter.no}`} className="btn btn-primary">Open</Link>
            </Card>
          ) : null}

          <Card tone="orange" icon="⚡" title="Quick game: 60 seconds" text="Beat your Fraction ↔ % record. Faster fractions mean faster Data Interpretation.">
            <Link href="/speed-math?drill=fractions" className="btn btn-primary">Play</Link>
          </Card>
        </div>

        {/* Shortcuts to the hubs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['/practice', '📝', 'Practice', 'PYQ papers and units', 'from-indigo-500 to-indigo-700'],
            ['/learn', '📘', 'Learn', 'Course and notes', 'from-teal-500 to-emerald-600'],
            ['/progress', '📊', 'Progress', 'Scores and mistakes', 'from-amber-500 to-orange-600'],
            ['/speed-math', '⚡', 'Speed Math', '11 quick games', 'from-rose-500 to-pink-600'],
          ].map(([href, icon, title, text, g]) => (
            <Link key={href} href={href} className={`rounded-2xl p-4 text-white bg-gradient-to-br ${g} shadow hover:shadow-lg hover:-translate-y-0.5 transition`}>
              <span className="text-2xl" aria-hidden>{icon}</span>
              <span className="block font-black mt-1">{title}</span>
              <span className="block text-[11px] text-white/85">{text}</span>
            </Link>
          ))}
        </div>
      </main>
      {auth && <AuthModal initialMode={auth} onClose={() => setAuth(null)} onSuccess={() => setAuth(null)} />}
      {starting && <LoadingScreen message={starting} />}
    </div>
  );
}

const TONES: Record<string, string> = {
  amber: 'border-amber-300 bg-amber-50', violet: 'border-violet-300 bg-violet-50', emerald: 'border-emerald-300 bg-emerald-50',
  teal: 'border-teal-300 bg-teal-50', orange: 'border-orange-300 bg-orange-50',
};

function Card({ tone, icon, title, text, children }: { tone: string; icon: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border-l-4 ${TONES[tone]} border p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm`}>
      <span className="text-3xl shrink-0" aria-hidden>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-black text-slate-900">{title}</p>
        <p className="text-sm text-slate-600">{text}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">{children}</div>
    </div>
  );
}
