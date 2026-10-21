"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DISCLAIMER, MAINTAINER, SITE_NAME } from '@/lib/site';

// Footer on every page except during a test (/quiz), where nothing should distract.
export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith('/quiz')) return null;
  return (
    <footer className="mt-8 border-t border-slate-200 bg-white/70 px-4 py-5 text-center text-xs text-slate-500">
      <p role="note" className="mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
        <span className="font-bold">Disclaimer: </span>{DISCLAIMER}
      </p>
      <p className="mt-3">
        {SITE_NAME} is maintained by <span className="font-semibold text-slate-700">{MAINTAINER.name}</span>,{' '}
        {MAINTAINER.department}, {MAINTAINER.institution}.
      </p>
      <p className="mt-1.5">
        Found a problem or have a suggestion?{' '}
        <Link href="/contact" className="font-bold text-indigo-700 hover:underline">Contact us</Link>
      </p>
    </footer>
  );
}
