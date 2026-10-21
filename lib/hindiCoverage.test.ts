import { describe, expect, it } from 'vitest';
import { hindiCoverage } from './hindiImages';

const pics = new Set(['PIC_PAPER']);

describe('hindiCoverage', () => {
  it('is FULL when every question has typed Hindi', () => {
    expect(hindiCoverage({ paper_id: 'A', question_count: 50, hindi_text_count: 50 }, pics)).toBe('FULL');
  });
  it('is FULL for papers whose Hindi is the NTA picture', () => {
    expect(hindiCoverage({ paper_id: 'PIC_PAPER', question_count: 50, hindi_text_count: 0 }, pics)).toBe('FULL');
  });
  it('is PARTIAL when only some questions have Hindi', () => {
    expect(hindiCoverage({ paper_id: 'A', question_count: 50, hindi_text_count: 12 }, pics)).toBe('PARTIAL');
  });
  it('is NONE with no Hindi, or when the count is missing', () => {
    expect(hindiCoverage({ paper_id: 'A', question_count: 50, hindi_text_count: 0 }, pics)).toBe('NONE');
    expect(hindiCoverage({ paper_id: 'A', question_count: 50 }, pics)).toBe('NONE');
  });
});
