import { cleanNewlines, normalizeUnit } from './scoring';
import type { NormalizedQuestion, PublicQuestion } from './types';

export function normalizeQuestion(q: PublicQuestion): NormalizedQuestion {
  const optionsHi = (q.option_a_hi || q.option_b_hi)
    ? [cleanNewlines(q.option_a_hi), cleanNewlines(q.option_b_hi), cleanNewlines(q.option_c_hi), cleanNewlines(q.option_d_hi)]
    : null;

  return {
    id: q.id,
    paperId: q.paper_id,
    cycle: q.cycle || 'DEC_2025',
    unit: normalizeUnit(q.unit),
    questionText: cleanNewlines(q.question_text),
    questionTextHi: q.question_text_hi ? cleanNewlines(q.question_text_hi) : null,
    layoutText: q.layout_text ? cleanNewlines(q.layout_text) : null,
    layoutTextHi: q.layout_text_hi ? cleanNewlines(q.layout_text_hi) : null,
    options: [cleanNewlines(q.option_a), cleanNewlines(q.option_b), cleanNewlines(q.option_c), cleanNewlines(q.option_d)],
    optionsHi,
  };
}

export const UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: 'Teaching Aptitude', label: 'Unit I: Teaching Aptitude' },
  { value: 'Research Aptitude', label: 'Unit II: Research Aptitude' },
  { value: 'Comprehension', label: 'Unit III: Comprehension' },
  { value: 'Communication', label: 'Unit IV: Communication' },
  { value: 'Mathematical Reasoning and Aptitude', label: 'Unit V: Mathematical Reasoning & Aptitude' },
  { value: 'Logical Reasoning', label: 'Unit VI: Logical Reasoning' },
  { value: 'Data Interpretation', label: 'Unit VII: Data Interpretation' },
  { value: 'Information and Communication Technology (ICT)', label: 'Unit VIII: ICT' },
  { value: 'People, Development and Environment', label: 'Unit IX: People, Dev & Environment' },
  { value: 'Higher Education System', label: 'Unit X: Higher Education System' },
];

const CYCLE_DISPLAY_NAMES: Record<string, string> = {
  DEC_2025: 'December 2025 Cycle',
  JUNE_2025: 'June 2025 Cycle',
  DEC_2024: 'December 2024 Cycle',
  JUNE_2024: 'June 2024 Cycle',
};

export function getCycleDisplayName(cycleId: string) {
  return CYCLE_DISPLAY_NAMES[cycleId] || cycleId.replace(/_/g, ' ');
}

export function getPaperDisplayName(paperId: string) {
  return paperId.replace(/_/g, ' ').replace(/-/g, ' ');
}
