import { describe, expect, it } from 'vitest';
import { formatPaperTitle, formatTestLabel, testTitle } from './testTitle';
import type { TestSession } from './types';

const base: TestSession = {
  session_id: 's', mode: 'FULL', paper_id: null, unit: null, duration_seconds: 0,
  started_at: '', server_now: '', questions: [],
};

describe('formatPaperTitle', () => {
  it('formats the standard paper id', () => {
    expect(formatPaperTitle('30_ENGLISH_06_DEC_2023_SHIFT1')).toBe('30 English · 06 Dec 2023 · Shift 1');
    expect(formatPaperTitle('82_FORENSIC_SCIENCE_26_JUN_2025_SHIFT1')).toBe('82 Forensic Science · 26 Jun 2025 · Shift 1');
  });
  it('handles older ids', () => {
    expect(formatPaperTitle('31_DEC_2025_MORNING')).toBe('31 Dec 2025 · Morning');
    expect(formatPaperTitle('02_JAN_2026_EEVENING_QUESTION_PAPER')).toBe('02 Jan 2026 · Evening');
    expect(formatPaperTitle('GENERAL_PAPER_18_JUN_2024_SHIFT2')).toBe('General Paper · 18 Jun 2024 · Shift 2');
  });
});

describe('testTitle', () => {
  it('names each kind of test', () => {
    expect(testTitle({ ...base, mode: 'FULL', paper_id: '30_ENGLISH_06_DEC_2023_SHIFT1' }, 50))
      .toBe('Full Test · 30 English · 06 Dec 2023 · Shift 1 · 50 Qs');
    expect(testTitle({ ...base, mode: 'UNIT', unit: 'Research Aptitude' }, 10)).toBe('Unit Practice · Research Aptitude · 10 Qs');
    expect(testTitle({ ...base, mode: 'UNIT', unit: 'Research Aptitude', topic: 'Steps of Research' }, 10))
      .toBe('Topic Practice · Research Aptitude › Steps of Research · 10 Qs');
    expect(testTitle({ ...base, mode: 'DAILY', label: 'Daily Practice 18 Oct 2026' }, 10)).toBe('Daily Practice · 18 Oct 2026 · 10 Qs');
    expect(testTitle({ ...base, mode: 'VAULT', label: 'Vault: Wrong answers' }, 7)).toBe('Revision Vault · Wrong answers · 7 Qs');
  });
  it('is empty without a session', () => {
    expect(testTitle(null, 0)).toBe('');
  });
});

describe('formatTestLabel', () => {
  it('tidies saved full test names and leaves others alone', () => {
    expect(formatTestLabel('Full Test (01 ECONOMICS 12 DEC 2023 SHIFT1)')).toBe('Full Test · 01 Economics · 12 Dec 2023 · Shift 1');
    expect(formatTestLabel('Teaching Aptitude (10 Qs)')).toBe('Teaching Aptitude (10 Qs)');
    expect(formatTestLabel(null)).toBe('');
  });
});
