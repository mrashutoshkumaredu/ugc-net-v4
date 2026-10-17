import VaultClient from '@/components/learning/VaultClient';

// Live data from the database (and KaTeX), so never prerendered.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Revision Vault · UGC NET Paper 1 Portal', robots: { index: false } };

export default function Page() {
  return <VaultClient />;
}
