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
import { formatTestLabel } from '@/lib/testTitle';

// The test clock keeps running while you are away, so say plainly how much time is left.
function timeLeftText(endsAt?: number) {
  if (!endsAt) return 'The test clock kept running while you were away.';
  const mins = Math.floor((endsAt - Date.now()) / 60000);
  if (mins < 1) return "Time is up. Open it to submit and see your score.";
  return `About ${mins} minute${mins === 1 ? '' : 's'} left on the clock.`;
}

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
  // Work out the greeting in the browser, from the student's own clock. The page is
  // built in advance on the server, so its time would be wrong for most visitors.
  const [hello, setHello] = useState('Hello');
  useEffect(() => {
    const hour = new Date().getHours();
    setHello(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');
  }, []);
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
                <Link href="/performance" className="self-center text-xs font-bold bg-white/15 hover:bg-white/25 rounded-lg px-3 py-2">🎯 Set your exam date</Link>
              )}
            </div>
          ) : !user && checkedSession ? (
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => setAuth('REGISTER')} className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black rounded-xl">Create free account</button>
            </div>
          ) : null}
        </div>

        {/* Priority cards */}
        <div className="space-y-3">
          {resumable && user && (
            <Card tone="amber" icon="⏯" title="Finish your unfinished test" text={`${formatTestLabel(resumable.label) || 'Test in progress'}. ${timeLeftText(resumable.endsAt)}`}>
              <button onClick={() => go('Resuming your test', `/quiz?session=${resumable.sessionId}`)} className="btn bg-indigo-600 hover:bg-indigo-700 text-white">Resume</button>
              <button onClick={() => { clearProgress(resumable.sessionId); setResumable(null); }} className="text-xs text-amber-800 hover:underline" title="Discard this test">Discard</button>
            </Card>
          )}

          {tasks.length > 0 && (
            <Card tone="violet" icon="📋" title={`${tasks.length} class task${tasks.length > 1 ? 's' : ''} to do`} text={tasks.slice(0, 3).map((t) => `${t.title}${t.due_on ? ` (due ${new Date(t.due_on + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})` : ''}`).join(' · ')}>
              <Link href={taskHref(tasks[0])} className="btn bg-indigo-600 hover:bg-indigo-700 text-white">Start next</Link>
              <Link href="/classes" className="text-xs text-violet-800 hover:underline">All tasks</Link>
            </Card>
          )}

          {user && progress && (
            <Card tone="emerald" icon={progress.daily_done ? '✅' : '🎯'} title={progress.daily_done ? 'Daily Practice done. Well done!' : 'Daily Practice · 10 questions'}
              text={progress.revisions_due > 0 ? `${progress.revisions_due} question${progress.revisions_due > 1 ? 's' : ''} you got wrong ${progress.revisions_due > 1 ? 'are' : 'is'} due for revision, plus new questions from your weakest units.` : 'New questions from your weakest units. Wrong answers come back after 1, 3 and 7 days.'}>
              <button onClick={() => go('Starting Daily Practice', '/quiz?mode=DAILY')} className={`btn ${progress.daily_done ? 'bg-slate-100 text-slate-700' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>{progress.daily_done ? 'Again' : 'Start'}</button>
            </Card>
          )}

          {diag && diag.best === null ? (
            <Card tone="teal" icon="🩺" title="Find your weak chapters" text={`Free Diagnostic Test: ${diag.questions} questions, one from each maths chapter.`}>
              <Link href={`/course?set=${diag.id}`} className="btn bg-indigo-600 hover:bg-indigo-700 text-white">Take it</Link>
            </Card>
          ) : nextChapter ? (
            <Card tone="teal" icon="📘" title={`Next chapter: ${nextChapter.title}`} text={nextChapter.subtitle || 'Continue the Maths Course.'}>
              <Link href={`/course?ch=${nextChapter.no}`} className="btn bg-indigo-600 hover:bg-indigo-700 text-white">Open</Link>
            </Card>
          ) : null}

          <Card tone="orange" icon="⚡" title="Quick game: 60 seconds" text="Beat your Fraction ↔ % record. Faster fractions mean faster Data Interpretation.">
            <Link href="/speed-math?drill=fractions" className="btn bg-indigo-600 hover:bg-indigo-700 text-white">Play</Link>
          </Card>
        </div>

        {/* Shortcuts to the hubs */}
        {/* Hidden on phones: the bottom bar already has these four. */}
        <div className="hidden md:grid grid-cols-4 gap-3">
          {[
            ['/practice', '📝', 'Practice', 'PYQ papers and units', 'from-indigo-500 to-indigo-700'],
            ['/learn', '📘', 'Learn', 'Course and notes', 'from-teal-500 to-emerald-600'],
            ['/progress', '📊', 'Progress', 'Scores and mistakes', 'from-amber-500 to-orange-600'],
            ['/speed-math', '⚡', 'Speed Maths', '11 quick games', 'from-rose-500 to-pink-600'],
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
  // White cards; the colour stays only on the left edge, so buttons and right/wrong colours stand out.
  amber: 'border-slate-200 border-l-amber-400 bg-white', violet: 'border-slate-200 border-l-violet-400 bg-white', emerald: 'border-slate-200 border-l-emerald-400 bg-white',
  teal: 'border-slate-200 border-l-teal-400 bg-white', orange: 'border-slate-200 border-l-orange-400 bg-white',
};

function Card({ tone, icon, title, text, children }: { tone: string; icon: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border-l-4 ${TONES[tone]} border p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm`}>
      <span className="text-3xl shrink-0 w-10 text-center" aria-hidden>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-black text-slate-900">{title}</p>
        <p className="text-sm text-slate-600">{text}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0 [&_.btn]:inline-flex [&_.btn]:justify-center [&_.btn]:min-w-[7rem] [&_.btn]:px-4 [&_.btn]:py-2 [&_.btn]:rounded-xl [&_.btn]:text-sm [&_.btn]:font-bold [&_.btn]:transition">{children}</div>
    </div>
  );
}
