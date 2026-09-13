import type { Question, UnitBreakdown } from './types';

const CORRECT_MARKS = 2;

/**
 * Pure scoring function shared by app/api/submit and its tests. Kept free of
 * any Supabase/network dependency so it can be unit tested without a live DB.
 */
export function scoreSubmission(questions: Question[], answers: Record<number, number>) {
  let correctCount = 0;
  const unitBreakdown: UnitBreakdown = {};

  for (const q of questions) {
    const unit = q.unit || 'General';
    if (!unitBreakdown[unit]) unitBreakdown[unit] = { total: 0, correct: 0 };
    unitBreakdown[unit].total += 1;

    if (answers[q.id] === q.correct_option) {
      correctCount += 1;
      unitBreakdown[unit].correct += 1;
    }
  }

  const totalQuestions = questions.length;
  const scorePercentage = totalQuestions > 0
    ? Number(((correctCount / totalQuestions) * 100).toFixed(2))
    : 0;
  const marksObtained = correctCount * CORRECT_MARKS;

  return { correctCount, totalQuestions, scorePercentage, marksObtained, unitBreakdown };
}

export function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
  const s = (safeSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function cleanNewlines(str: string | null | undefined) {
  if (!str) return '';
  return str.replace(/\\n/g, '\n');
}

export function normalizeUnit(unitStr: string | null | undefined) {
  if (!unitStr) return 'General';
  const clean = unitStr.replace(/^Unit\s+\d+:\s*/i, '').trim();
  if (clean === 'Reading Comprehension') return 'Comprehension';
  return clean;
}
