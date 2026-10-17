import { describe, expect, it } from 'vitest';
import { scoreSubmission, formatTime, cleanNewlines, normalizeUnit } from './scoring';
import type { Question } from './types';

function makeQuestion(overrides: Partial<Question>): Question {
  return {
    id: 1,
    paper_id: 'P1',
    cycle: 'DEC_2025',
    unit: 'Teaching Aptitude',
    question_text: 'Q?',
    question_text_hi: null,
    layout_text: null,
    layout_text_hi: null,
    option_a: 'A',
    option_b: 'B',
    option_c: 'C',
    option_d: 'D',
    option_a_hi: null,
    option_b_hi: null,
    option_c_hi: null,
    option_d_hi: null,
    correct_option: 0,
    ai_hint: null,
    ...overrides,
  };
}

describe('scoreSubmission', () => {
  it('scores all-correct answers at 100%', () => {
    const questions = [
      makeQuestion({ id: 1, correct_option: 0 }),
      makeQuestion({ id: 2, correct_option: 2 }),
    ];
    const result = scoreSubmission(questions, { 1: 0, 2: 2 });
    expect(result.correctCount).toBe(2);
    expect(result.totalQuestions).toBe(2);
    expect(result.scorePercentage).toBe(100);
    expect(result.marksObtained).toBe(4);
  });

  it('does not penalize wrong or unanswered questions (no negative marking)', () => {
    const questions = [
      makeQuestion({ id: 1, correct_option: 0 }),
      makeQuestion({ id: 2, correct_option: 2 }),
      makeQuestion({ id: 3, correct_option: 1 }),
    ];
    // q1 wrong, q2 correct, q3 unanswered
    const result = scoreSubmission(questions, { 1: 3, 2: 2 });
    expect(result.correctCount).toBe(1);
    expect(result.marksObtained).toBe(2);
    expect(result.scorePercentage).toBeCloseTo(33.33, 1);
  });

  it('buckets correctness per unit', () => {
    const questions = [
      makeQuestion({ id: 1, unit: 'Teaching Aptitude', correct_option: 0 }),
      makeQuestion({ id: 2, unit: 'Research Aptitude', correct_option: 0 }),
    ];
    const result = scoreSubmission(questions, { 1: 0, 2: 3 });
    expect(result.unitBreakdown['Teaching Aptitude']).toEqual({ total: 1, correct: 1 });
    expect(result.unitBreakdown['Research Aptitude']).toEqual({ total: 1, correct: 0 });
  });

  it('falls back to "General" when unit is missing', () => {
    const questions = [makeQuestion({ id: 1, unit: null, correct_option: 0 })];
    const result = scoreSubmission(questions, { 1: 0 });
    expect(result.unitBreakdown['General']).toEqual({ total: 1, correct: 1 });
  });

  it('handles an empty question set without dividing by zero', () => {
    const result = scoreSubmission([], {});
    expect(result.scorePercentage).toBe(0);
    expect(result.correctCount).toBe(0);
  });
});

describe('formatTime', () => {
  it('formats seconds as mm:ss', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(59)).toBe('00:59');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(3661)).toBe('61:01');
  });

  it('clamps negative values to zero', () => {
    expect(formatTime(-5)).toBe('00:00');
  });
});

describe('cleanNewlines', () => {
  it('converts literal \\n sequences to real newlines', () => {
    expect(cleanNewlines('line1\\nline2')).toBe('line1\nline2');
  });

  it('returns empty string for nullish input', () => {
    expect(cleanNewlines(null)).toBe('');
    expect(cleanNewlines(undefined)).toBe('');
  });
});

describe('normalizeUnit', () => {
  it('strips "Unit N:" prefixes', () => {
    expect(normalizeUnit('Unit 1: Teaching Aptitude')).toBe('Teaching Aptitude');
    expect(normalizeUnit('Unit 10: Higher Education System')).toBe('Higher Education System');
  });

  it('maps "Reading Comprehension" to "Comprehension"', () => {
    expect(normalizeUnit('Reading Comprehension')).toBe('Comprehension');
  });

  it('falls back to "General" for missing input', () => {
    expect(normalizeUnit(null)).toBe('General');
    expect(normalizeUnit(undefined)).toBe('General');
  });
});
