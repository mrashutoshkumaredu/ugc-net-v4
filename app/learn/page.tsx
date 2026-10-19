import PageShell from '@/components/PageShell';
import HubTiles from '@/components/HubTiles';

export const metadata = { title: 'Learn · UGC NET Paper 1 Portal' };

export default function LearnPage() {
  return (
    <PageShell title="📘 Learn" subtitle="Study a topic properly, then practise it." wide>
      <HubTiles tiles={[
        { href: '/course', icon: '📐', title: 'Maths Course', text: '21 chapters from the basics, with daily practice papers, a diagnostic and mocks.', gradient: 'from-teal-500 to-emerald-600' },
        { href: '/notes', icon: '🗒️', title: 'Revision Notes', text: 'Short notes for every unit of Paper 1.', gradient: 'from-sky-500 to-indigo-600' },
        { href: '/trends', icon: '📈', title: 'PYQ Trends', text: 'The topics NTA asks most often, so you know where to focus.', gradient: 'from-violet-500 to-fuchsia-600' },
      ]} />
    </PageShell>
  );
}
