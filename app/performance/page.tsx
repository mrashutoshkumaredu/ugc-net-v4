import PerformanceClient from '@/components/learning/PerformanceClient';

// Live data from the database (and KaTeX), so never prerendered.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'My Performance · UGC NET Paper 1 Portal', robots: { index: false } };

export default function Page() {
  return <PerformanceClient />;
}
