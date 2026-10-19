// Site navigation: four hubs plus Class. Each page belongs to one hub.
export type HubId = 'today' | 'practice' | 'learn' | 'progress' | 'class';
export type Hub = { id: HubId; label: string; icon: string; href: string; accent: string; sub: { href: string; label: string }[] };

export const HUBS: Hub[] = [
  { id: 'today', label: 'Today', icon: '🏠', href: '/', accent: 'bg-indigo-600', sub: [] },
  {
    id: 'practice', label: 'Practice', icon: '📝', href: '/practice', accent: 'bg-indigo-600',
    sub: [{ href: '/practice', label: 'Papers, Units & Daily' }, { href: '/speed-math', label: '⚡ Speed Math' }],
  },
  {
    id: 'learn', label: 'Learn', icon: '📘', href: '/learn', accent: 'bg-teal-600',
    sub: [{ href: '/course', label: 'Maths Course' }, { href: '/notes', label: 'Revision Notes' }, { href: '/trends', label: 'PYQ Trends' }],
  },
  {
    id: 'progress', label: 'Progress', icon: '📊', href: '/progress', accent: 'bg-amber-500',
    sub: [{ href: '/performance', label: 'My Performance' }, { href: '/vault', label: 'Revision Vault' }, { href: '/leaderboard', label: 'Leaderboard' }],
  },
  { id: 'class', label: 'Class', icon: '👥', href: '/classes', accent: 'bg-violet-600', sub: [] },
];

export function hubOf(pathname: string | null): HubId {
  const p = pathname || '/';
  if (p === '/') return 'today';
  if (p.startsWith('/practice') || p.startsWith('/speed-math') || p.startsWith('/quiz') || p.startsWith('/review')) return 'practice';
  if (p.startsWith('/learn') || p.startsWith('/course') || p.startsWith('/notes') || p.startsWith('/trends')) return 'learn';
  if (p.startsWith('/progress') || p.startsWith('/performance') || p.startsWith('/vault') || p.startsWith('/leaderboard')) return 'progress';
  if (p.startsWith('/classes')) return 'class';
  return 'today';
}
