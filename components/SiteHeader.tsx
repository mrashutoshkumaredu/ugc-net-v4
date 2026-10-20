"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { isAdmin } from '@/lib/testApi';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useClassHub } from '@/hooks/useClassHub';
import { formatTime } from '@/lib/scoring';
import { HUBS, hubOf } from '@/lib/hubs';
import AuthModal from './AuthModal';
import HistoryDrawer from './HistoryDrawer';
import SettingsModal from './SettingsModal';

export default function SiteHeader({ masterSecondsRemaining }: { masterSecondsRemaining?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [menu, setMenu] = useState(false);
  const [fsOn, setFsOn] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const classHub = useClassHub(user?.id);
  const inTest = masterSecondsRemaining !== undefined;
  const current = hubOf(pathname);
  const hubs = HUBS.filter((h) => h.id !== 'class' || classHub.show || current === 'class');
  const hub = HUBS.find((h) => h.id === current)!;

  useEffect(() => {
    let cancelled = false;
    if (!user) { setAdmin(false); return; }
    isAdmin().then((ok) => { if (!cancelled) setAdmin(ok); });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const sync = () => setFsOn(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    const close = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', close);
    return () => { document.removeEventListener('fullscreenchange', sync); document.removeEventListener('mousedown', close); };
  }, []);

  const goHome = () => {
    if (inTest && !confirm('Leave the test? The timer keeps running. Your answers are saved on this device, and you can resume from the Today page.')) return;
    router.push('/');
  };
  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
    setMenu(false);
  };
  const name = (user?.user_metadata?.full_name as string | undefined) || user?.email || '';
  const initial = name.trim().charAt(0).toUpperCase() || '🙂';

  return (
    <>
      <header className="bg-indigo-900 text-white shadow-md z-40 shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <Link href="/" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); goHome(); }} className="cursor-pointer group min-w-0">
            <p className="text-base sm:text-lg font-black tracking-wide group-hover:text-amber-400 transition truncate">UGC NET Paper 1</p>
            <p className="text-[10px] text-indigo-200 hidden sm:block">Practice · Learn · Track</p>
          </Link>

          {/* Hubs on wide screens */}
          {!inTest && (
            <nav aria-label="Main" className="hidden md:flex items-center gap-1">
              {hubs.map((h) => {
                const active = h.id === current;
                return (
                  <Link key={h.id} href={h.href} aria-current={active ? 'page' : undefined}
                    className={`relative px-3.5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ${active ? 'bg-white text-indigo-900 shadow' : 'text-indigo-100 hover:bg-indigo-800'}`}>
                    <span aria-hidden>{h.icon}</span>{h.label}
                    {h.id === 'class' && classHub.pending > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">{classHub.pending}</span>}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {inTest && (
              <>
                <div className="bg-indigo-950 border border-amber-400/40 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-inner">
                  <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider hidden sm:inline">Time left</span>
                  <span className="text-sm font-mono font-bold text-amber-400">{formatTime(masterSecondsRemaining)}</span>
                </div>
                <button onClick={goHome} className="text-xs bg-indigo-800 hover:bg-indigo-700 border border-indigo-600 px-3 py-2 rounded-lg font-medium">🏠</button>
              </>
            )}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenu((v) => !v)} aria-label="Account menu" aria-expanded={menu}
                  className="w-9 h-9 rounded-full bg-amber-400 text-indigo-950 font-black flex items-center justify-center hover:ring-2 hover:ring-white/60">
                  {initial}
                </button>
                {menu && (
                  <div className="absolute right-0 mt-2 w-60 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50">
                    <p className="px-4 pb-2 mb-1 border-b border-slate-100 text-xs text-slate-500 truncate">👋 {name}</p>
                    <button onClick={() => { setShowHistory(true); setMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50">🕘 My test history</button>
                    <button onClick={() => { setShowSettings(true); setMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50">⚙️ Settings: exam date, leaderboard</button>
                    <button onClick={toggleFs} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50">{fsOn ? '⤓ Exit full screen' : '⤢ Full screen'}</button>
                    {admin && <Link href="/admin" onClick={() => setMenu(false)} className="block px-4 py-2 text-sm hover:bg-slate-50 text-rose-700 font-semibold">🛠 Admin</Link>}
                    <button onClick={() => { setMenu(false); signOut(); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-t border-slate-100 mt-1">↩ Log out</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => setAuthMode('LOGIN')} className="text-xs bg-indigo-800 hover:bg-indigo-700 border border-indigo-600 px-3 py-2 rounded-lg font-medium">Login</button>
                <button onClick={() => setAuthMode('REGISTER')} className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-3 py-2 rounded-lg">Register</button>
              </>
            )}
          </div>
        </div>

        {/* Sub-pages of the current hub */}
        {!inTest && hub.sub.length > 0 && (
          <div className="bg-indigo-950/60">
            <nav aria-label={`${hub.label} pages`} className="max-w-[1600px] mx-auto px-4 sm:px-6 py-1.5 flex gap-1 overflow-x-auto text-xs font-semibold whitespace-nowrap">
              {hub.sub.map((s) => {
                const active = pathname === s.href.split('?')[0];
                return (
                  <Link key={s.href} href={s.href} aria-current={active ? 'page' : undefined}
                    className={`px-3 py-1.5 rounded-lg transition ${active ? 'bg-white/95 text-indigo-900' : 'text-indigo-100 hover:bg-indigo-800'}`}>{s.label}</Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {authMode && <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} onSuccess={() => setAuthMode(null)} />}
      {showHistory && <HistoryDrawer onClose={() => setShowHistory(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
