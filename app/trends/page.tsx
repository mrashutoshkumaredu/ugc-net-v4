import TrendsClient from '@/components/learning/TrendsClient';

// Live data from the database (and KaTeX), so never prerendered.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'PYQ Trends · UGC NET Paper 1 Portal', description: 'How many UGC NET Paper 1 questions each unit got in every exam cycle.' };

export default function Page() {
  return <TrendsClient />;
}
