import LeaderboardClient from '@/components/learning/LeaderboardClient';

// Live data from the database (and KaTeX), so never prerendered.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Leaderboard · UGC NET Paper 1 Portal' };

export default function Page() {
  return <LeaderboardClient />;
}
