"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { OPEN_GUIDE_EVENT } from '@/lib/welcome';
import { SITE_NAME } from '@/lib/site';

// One slim line of links on every page except during a test (/quiz), where nothing should distract.
// The full disclaimer and the maintainer details live on their own pages.
export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith('/quiz')) return null;
  const link = 'font-semibold text-indigo-700 hover:underline';
  return (
    <footer className="mt-8 border-t border-slate-200 bg-white/70 px-4 py-4 text-center text-xs text-slate-500">
      <nav aria-label="Site information" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>{SITE_NAME}</span>
        <Link href="/disclaimer" className={link}>Disclaimer</Link>
        <Link href="/about" className={link}>About</Link>
        <Link href="/contact" className={link}>Contact us</Link>
        <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_GUIDE_EVENT))} className={link}>How to use this site</button>
      </nav>
    </footer>
  );
}
