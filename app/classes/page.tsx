import ClassesClient from '@/components/classes/ClassesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Classes & Tasks · UGC NET Paper 1 Portal',
  description: 'Teachers set papers, unit practice and Speed Maths tasks. Students join with a code and track their tasks.',
};

export default function Page() {
  return <ClassesClient />;
}
