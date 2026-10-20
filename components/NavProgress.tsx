"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Shows a moving bar at the top and a small "Loading…" label as soon as a link
// to another page is clicked, until the new page appears. Without it a slow
// page change looks like the click did nothing.
export default function NavProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // New page is on screen: hide.
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setLoading(true);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Safety net: never leave the bar stuck if a page change is cancelled.
  useEffect(() => {
    if (!loading) return;
    const t = window.setTimeout(() => setLoading(false), 15000);
    return () => window.clearTimeout(t);
  }, [loading]);

  if (!loading) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[70] pointer-events-none" role="status" aria-live="polite">
      <div className="h-1 w-full overflow-hidden bg-indigo-100">
        <div className="h-full w-1/3 bg-indigo-600 nav-progress-bar" />
      </div>
      {/* At the bottom, so it does not cover headings at the top of the page. */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-20 md:bottom-6 rounded-full bg-indigo-900 text-white text-xs font-semibold px-3 py-1 shadow">
        Loading… <span className="opacity-80">लोड हो रहा है</span>
      </div>
    </div>
  );
}
