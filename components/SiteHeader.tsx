"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isAdmin } from '@/lib/testApi';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { formatTime } from '@/lib/scoring';
import AuthModal from './AuthModal';
import HistoryDrawer from './HistoryDrawer';

const NAV = [
  { href: '/', label: 'Practice' },
  { href: '/vault', label: 'Revision Vault' },
  { href: '/performance', label: 'My Performance' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/speed-math', label: 'Speed Math' },
  { href: '/trends', label: 'PYQ Trends' },
  { href: '/notes', label: 'Revision Notes' },
];

export default function SiteHeader({ masterSecondsRemaining }: { masterSecondsRemaining?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setAdmin(false); return; }
    isAdmin().then((ok) => { if (!cancelled) setAdmin(ok); });
    return () => { cancelled = true; };
  }, [user]);

  const goHome = () => {
    if (masterSecondsRemaining !== undefined) {
      if (!confirm('Leave the test? The timer keeps running. Your answers are saved on this device, and you can resume from the home page.')) return;
    }
    router.push('/');
  };

  return (
    <>
      <header className="bg-indigo-900 text-white px-4 sm:px-6 py-3 shadow-md z-40 shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <div onClick={goHome} role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') goHome(); }} className="cursor-pointer flex flex-col items-center sm:items-start group text-center sm:text-left">
            <h1 className="text-base sm:text-lg font-bold tracking-wide group-hover:text-amber-400 transition">UGC NET Paper 1 Portal</h1>
            <p className="text-[10px] text-indigo-200">National Eligibility Test Practice Platform</p>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {masterSecondsRemaining !== undefined && (
              <div className="bg-indigo-950 border border-amber-400/40 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-inner">
                <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">Exam Time Left:</span>
                <span className="text-sm font-mono font-bold text-amber-400">{formatTime(masterSecondsRemaining)}</span>
              </div>
            )}

            <button onClick={goHome} className="text-xs bg-indigo-800 hover:bg-indigo-700 text-white border border-indigo-600 px-3 py-2 rounded-lg transition font-medium flex items-center gap-1.5 shrink-0">
              <span>🏠</span> Home
            </button>

            {user ? (
              <div className="text-xs bg-indigo-950 px-3 py-1.5 rounded-lg border border-indigo-700 flex items-center gap-2">
                <span className="font-medium text-indigo-200 truncate max-w-[100px] sm:max-w-none">
                  👋 {(user.user_metadata?.full_name as string | undefined) || user.email}
                </span>
                <button onClick={() => signOut()} className="text-amber-400 hover:underline font-bold ml-1">Logout</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setAuthMode('LOGIN')} className="text-xs bg-indigo-800 hover:bg-indigo-700 text-white border border-indigo-600 px-3 py-2 rounded-lg transition font-medium shrink-0">
                  Login
                </button>
                <button onClick={() => setAuthMode('REGISTER')} className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-3 py-2 rounded-lg transition shrink-0">
                  Register
                </button>
              </div>
            )}

            {admin && masterSecondsRemaining === undefined && (
              <Link href="/admin" className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg transition font-bold shrink-0">
                Admin
              </Link>
            )}

            <button onClick={() => setShowHistory(true)} className="text-xs bg-indigo-800 hover:bg-indigo-700 text-white border border-indigo-600 px-3 py-2 rounded-lg transition font-medium shrink-0">
              My History
            </button>
          </div>
        </div>
        {masterSecondsRemaining === undefined && (
          <nav aria-label="Main" className="max-w-[1600px] mx-auto mt-2.5 -mb-1 flex gap-1 overflow-x-auto text-xs font-semibold whitespace-nowrap">
            {NAV.map((n) => {
              const active = n.href === '/' ? pathname === '/' : pathname?.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-md transition ${active ? 'bg-white text-indigo-900' : 'text-indigo-100 hover:bg-indigo-800'}`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {authMode && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setAuthMode(null)}
          onSuccess={() => setAuthMode(null)}
        />
      )}
      {showHistory && <HistoryDrawer onClose={() => setShowHistory(false)} />}
    </>
  );
}
