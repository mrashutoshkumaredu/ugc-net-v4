import ReviewClient from '@/components/learning/ReviewClient';

// Live data from the database (and KaTeX), so never prerendered.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Deep Review · UGC NET Paper 1 Portal', robots: { index: false } };

export default function Page() {
  return <ReviewClient />;
}
