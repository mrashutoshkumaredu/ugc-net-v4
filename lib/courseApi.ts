import { supabase } from './supabase';
import type { IconName } from '@/components/Icon';

// Wrappers for the Maths course functions (supabase/migrations/20261019_09_course_schema.sql).

export type CourseChapter = { no: number; part: string; title: string; subtitle: string | null; classes: number[]; can_read: boolean };
export type CourseSet = {
  id: string; title: string; kind: 'dpp' | 'test' | 'diagnostic' | 'mock';
  chapter_no: number | null; class_no: number | null; minutes: number; questions: number; best: number | null;
};
export type CourseQuestion = {
  id: number; position: number; level: string | null; source: string | null;
  question_html: string; layout_html: string | null; options: string[];
};
export type CourseResult = {
  correct: number; total: number; score_percentage: number; saved: boolean;
  key: Record<string, { correct: number; explanation: string | null }>;
};

async function call<T>(fn: string, args: Record<string, unknown> | undefined, fallback: string): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    const m = error.message || '';
    if (m.toLowerCase().includes('failed to fetch')) throw new Error("Couldn't reach the server. Check your internet connection.");
    throw new Error(m ? `${fallback} (${m.slice(0, 120)})` : fallback);
  }
  return data as T;
}

export const courseApi = {
  catalog: () => call<{ chapters: CourseChapter[]; sets: CourseSet[] }>('course_catalog', undefined, 'Could not load the course.'),
  lesson: (no: number) => call<{ locked: boolean; html?: string }>('course_lesson', { p_chapter: no }, 'Could not load the lesson.'),
  setQuestions: (id: string) => call<{ set: { id: string; title: string; kind: string; chapter_no: number | null; minutes: number } | null; questions: CourseQuestion[] }>(
    'course_set_questions', { p_set: id }, 'Could not load the questions.'),
  submit: (id: string, answers: Record<number, number>, seconds: number, taskId: string | null) =>
    call<CourseResult>('course_submit_set', { p_set: id, p_answers: answers, p_seconds: seconds, p_task: taskId }, 'Could not submit.'),
  lessonDone: (taskId: string) => call<void>('course_lesson_done', { p_task: taskId }, 'Could not save.'),
  taskStats: (taskId: string) => call<{ position: number; question_html: string; answered: number; wrong: number }[]>(
    'course_task_question_stats', { p_task: taskId }, 'Could not load question stats.'),
};

export const PART_STYLE: Record<string, { icon: IconName; gradient: string }> = {
  A: { icon: 'calculator', gradient: 'from-indigo-500 to-indigo-700' },
  B: { icon: 'puzzle', gradient: 'from-indigo-500 to-indigo-700' },
  C: { icon: 'chart', gradient: 'from-indigo-500 to-indigo-700' },
  D: { icon: 'write', gradient: 'from-indigo-500 to-indigo-700' },
};
export const partLetter = (part: string) => (part.match(/Part ([A-D])/)?.[1] || 'A');
