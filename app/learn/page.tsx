import PageShell from '@/components/PageShell';
import HubTiles from '@/components/HubTiles';

export const metadata = { title: 'Learn · UGC NET Paper 1 Portal' };

export default function LearnPage() {
  return (
    <PageShell title="Learn" icon="learn" subtitle="Study a topic properly, then practise it." wide>
      <HubTiles tiles={[
        { href: '/course', icon: 'ruler', title: 'Maths Course', text: '21 chapters from the basics, with daily practice papers, a diagnostic and mocks.', gradient: 'from-indigo-500 to-indigo-700' },
        { href: '/notes', icon: 'notebook', title: 'Revision Notes', text: 'Short notes for every unit of Paper 1.', gradient: 'from-indigo-500 to-indigo-700' },
        { href: '/trends', icon: 'trend', title: 'PYQ Trends', text: 'The topics NTA asks most often, so you know where to focus.', gradient: 'from-indigo-500 to-indigo-700' },
      ]} />
    </PageShell>
  );
}
