import AdminClient from '@/components/admin/AdminClient';

// Per-user page (admin check, live data) — never prerendered. Also avoids
// the KaTeX stylesheet prerender issue noted in app/quiz/page.tsx.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Admin · UGC NET Paper 1 Portal', robots: { index: false } };

export default function AdminPage() {
  return <AdminClient />;
}
