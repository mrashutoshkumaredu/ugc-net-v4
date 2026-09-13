import QuizClient from '@/components/quiz/QuizClient';

// This route is inherently per-user/dynamic (auth state, exam config from
// query params, live timers) — force-dynamic also sidesteps a Next.js build
// bug where statically prerendering a client page that imports KaTeX's CSS
// fails with "ENOENT ... default-stylesheet.css".
export const dynamic = 'force-dynamic';

export default function QuizPage() {
  return <QuizClient />;
}
