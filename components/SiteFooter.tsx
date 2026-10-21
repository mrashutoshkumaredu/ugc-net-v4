"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { OPEN_GUIDE_EVENT } from '@/lib/welcome';
import { MAINTAINER, SITE_NAME } from '@/lib/site';

// Slim footer on every page except during a test, where nothing should distract.
export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith('/quiz')) return null;
  return (
    <footer className="mt-8 border-t border-slate-200 bg-white/70 px-4 py-5 text-center text-xs text-slate-500">
      <p>
        {SITE_NAME} is maintained by <span className="font-semibold text-slate-700">{MAINTAINER.name}</span>,{' '}
        {MAINTAINER.department}, {MAINTAINER.institution}.
      </p>
      <p className="mt-1.5">
        Found a problem or have a suggestion?{' '}
        <Link href="/contact" className="font-bold text-indigo-700 hover:underline">Contact us</Link>
        {' · '}
        <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_GUIDE_EVENT))} className="font-bold text-indigo-700 hover:underline">How to use this site</button>
      </p>
    </footer>
  );
}
