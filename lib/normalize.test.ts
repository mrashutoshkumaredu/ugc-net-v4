import { describe, expect, it } from 'vitest';
import { cycleSortKey, getCycleDisplayName, getPaperDisplayName, normalizeQuestion } from './normalize';
import type { PublicQuestion } from './types';

const base: PublicQuestion = {
  id: 7,
  paper_id: '09_EDUCATION_25_JUN_2025_SHIFT1',
  cycle: 'June_2025',
  unit: 'ICT',
  question_text: 'Line 1\\nLine 2',
  question_text_hi: null,
  layout_text: '   ',
  layout_text_hi: null,
  option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D',
  option_a_hi: null, option_b_hi: null, option_c_hi: null, option_d_hi: null,
  question_number: 12,
  is_dropped: true,
};

describe('normalizeQuestion', () => {
  it('cleans text, maps units and keeps paper number and dropped flag', () => {
    const q = normalizeQuestion(base);
    expect(q.questionText).toBe('Line 1\nLine 2');
    expect(q.unit).toBe('Information and Communication Technology (ICT)');
    expect(q.questionNumber).toBe(12);
    expect(q.isDropped).toBe(true);
  });

  it('treats blank reference text as none, so no empty panel is shown', () => {
    expect(normalizeQuestion(base).layoutText).toBeNull();
  });

  it('does not invent a cycle when it is missing', () => {
    expect(normalizeQuestion({ ...base, cycle: null }).cycle).toBe('Unknown');
  });
});

describe('cycle names', () => {
  it('formats database cycle ids and labels the cancelled June 2024 exam', () => {
    expect(getCycleDisplayName('December_2025')).toBe('December 2025 Cycle');
    expect(getCycleDisplayName('June_2024_Cancelled')).toMatch(/cancelled/i);
  });

  it('sorts newest cycle first', () => {
    const cycles = ['June_2023', 'December_2025', 'June_2025'];
    cycles.sort((a, b) => cycleSortKey(b) - cycleSortKey(a));
    expect(cycles).toEqual(['December_2025', 'June_2025', 'June_2023']);
  });

  it('turns paper ids into readable names', () => {
    expect(getPaperDisplayName('31_DEC_2025_MORNING')).toBe('31 DEC 2025 MORNING');
  });
});
