"use client";

import { useState } from 'react';
import PageShell from '@/components/PageShell';
import HubTiles from '@/components/HubTiles';
import HistoryDrawer from '@/components/HistoryDrawer';

export default function ProgressHub() {
  const [history, setHistory] = useState(false);
  return (
    <PageShell title="📊 Progress" subtitle="See how you are doing, fix your mistakes and compare with others." wide>
      <HubTiles tiles={[
        { href: '/performance', icon: '🎯', title: 'My Performance', text: 'Accuracy by unit, your weak areas, time per question and your exam date.', gradient: 'from-amber-500 to-orange-600' },
        { href: '/vault', icon: '🔁', title: 'Revision Vault', text: 'Every question you got wrong, saved to practise again.', gradient: 'from-rose-500 to-pink-600' },
        { href: '/leaderboard', icon: '🏆', title: 'Leaderboard', text: 'See where you stand, overall and cycle by cycle.', gradient: 'from-indigo-500 to-violet-600' },
      ]} />
      <button onClick={() => setHistory(true)} className="btn btn-secondary btn-lg w-full sm:w-auto">🕘 Open my test history</button>
      {history && <HistoryDrawer onClose={() => setHistory(false)} />}
    </PageShell>
  );
}
