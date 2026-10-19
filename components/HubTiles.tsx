import Link from 'next/link';

export type Tile = { href: string; icon: string; title: string; text: string; gradient: string };

// Big colourful cards used on the hub landing pages.
export default function HubTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tiles.map((t) => (
        <Link key={t.href} href={t.href}
          className={`group relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${t.gradient} shadow-md hover:shadow-xl hover:-translate-y-1 transition-all min-h-[140px] flex flex-col justify-end`}>
          <span className="absolute -right-2 -top-3 text-7xl opacity-20 group-hover:scale-110 transition-transform" aria-hidden>{t.icon}</span>
          <span className="text-3xl mb-2" aria-hidden>{t.icon}</span>
          <span className="text-lg font-black">{t.title}</span>
          <span className="text-sm text-white/85">{t.text}</span>
        </Link>
      ))}
    </div>
  );
}
