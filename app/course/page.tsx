import CourseClient from '@/components/course/CourseClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Maths Course · UGC NET Paper 1 Portal',
  description: 'Mathematical Aptitude, Reasoning and Data Interpretation for UGC NET Paper 1: 21 chapters with daily practice papers, a diagnostic test and mock tests.',
};

export default function Page() {
  return <CourseClient />;
}
