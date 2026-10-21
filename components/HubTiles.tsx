import Link from 'next/link';
import Icon, { type IconName } from '@/components/Icon';

export type Tile = { href: string; icon: IconName; title: string; text: string; gradient: string };

// Big colourful cards used on the hub landing pages.
export default function HubTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tiles.map((t) => (
        <Link key={t.href} href={t.href}
          className="group rounded-2xl p-4 sm:p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4">
          {/* Colour only in the small icon tile, so the page stays calm. */}
          <span className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white`} aria-hidden><Icon name={t.icon} className="w-6 h-6" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-black text-slate-900">{t.title}</span>
            <span className="block text-sm text-slate-600">{t.text}</span>
          </span>
          <span className="shrink-0 text-indigo-600 font-bold" aria-hidden>›</span>
        </Link>
      ))}
    </div>
  );
}
