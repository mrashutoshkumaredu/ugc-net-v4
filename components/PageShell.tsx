"use client";

import { useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import Icon, { type IconName } from '@/components/Icon';

// Standard page frame: header, a title block and the page content.
// With `requireLogin`, logged-out visitors see a login prompt instead.
export default function PageShell({
  title,
  icon,
  subtitle,
  requireLogin = false,
  wide = false,
  actions,
  children,
}: {
  title: string;
  icon?: IconName;
  subtitle?: string;
  requireLogin?: boolean;
  wide?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user, checkedSession } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  let body: React.ReactNode = children;
  if (requireLogin && !checkedSession) {
    body = <p className="text-sm text-slate-500">Loading…</p>;
  } else if (requireLogin && !user) {
    body = (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
        <p className="text-sm font-semibold text-slate-800 mb-1">Please log in to see this page</p>
        <p className="text-xs text-slate-500 mb-4">It shows your own tests and progress.</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => setShowLogin(true)} className="text-sm font-bold text-indigo-700 hover:underline">Log in</button>
          <Link href="/" className="text-sm font-bold text-slate-600 hover:underline">← Back to Home</Link>
        </div>
        {showLogin && <AuthModal initialMode="LOGIN" onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <SiteHeader />
      <main className={`w-full ${wide ? 'max-w-6xl' : 'max-w-4xl'} mx-auto p-4 sm:p-6 space-y-5`}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-indigo-950 flex items-center gap-2">{icon && <Icon name={icon} className="w-6 h-6 text-indigo-700" />}{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
        {body}
      </main>
    </div>
  );
}
