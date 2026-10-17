import NotesClient from '@/components/learning/NotesClient';

// Live data from the database (and KaTeX), so never prerendered.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Revision Notes · UGC NET Paper 1 Portal', description: 'Short revision notes for all ten UGC NET Paper 1 units.' };

export default function Page() {
  return <NotesClient />;
}
