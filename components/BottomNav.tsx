"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useClassHub } from '@/hooks/useClassHub';
import { HUBS, hubOf } from '@/lib/hubs';

// Phone tab bar: one tap to any hub. Hidden on wide screens and during a test.
export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const classHub = useClassHub(user?.id);
  if (pathname?.startsWith('/quiz')) return null;
  const current = hubOf(pathname);
  const hubs = HUBS.filter((h) => h.id !== 'class' || classHub.show || current === 'class');
  return (
    <>
      <div className="h-16 md:hidden" aria-hidden />
      <nav aria-label="Main" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {hubs.map((h) => {
            const active = h.id === current;
            return (
              <Link key={h.id} href={h.href} aria-current={active ? 'page' : undefined} className="relative flex-1 flex flex-col items-center py-2 gap-0.5">
                <span className={`text-xl leading-none transition ${active ? 'scale-110' : 'opacity-60'}`} aria-hidden>{h.icon}</span>
                <span className={`text-[10px] font-bold ${active ? 'text-indigo-700' : 'text-slate-500'}`}>{h.label}</span>
                {active && <span className={`absolute top-0 h-0.5 w-8 rounded-full ${h.accent}`} />}
                {h.id === 'class' && classHub.pending > 0 && <span className="absolute top-1 right-[28%] min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center">{classHub.pending}</span>}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
