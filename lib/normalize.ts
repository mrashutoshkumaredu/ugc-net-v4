import { cleanNewlines, normalizeUnit } from './scoring';
import type { NormalizedQuestion, PublicQuestion } from './types';

function blankToNull(s: string | null | undefined) {
  return s && s.trim() ? cleanNewlines(s) : null;
}

export function normalizeQuestion(q: PublicQuestion): NormalizedQuestion {
  const optionsHi = (q.option_a_hi || q.option_b_hi)
    ? [cleanNewlines(q.option_a_hi), cleanNewlines(q.option_b_hi), cleanNewlines(q.option_c_hi), cleanNewlines(q.option_d_hi)]
    : null;

  return {
    id: q.id,
    paperId: q.paper_id,
    cycle: q.cycle || 'Unknown',
    unit: normalizeUnit(q.unit),
    topic: q.topic ?? null,
    questionNumber: q.question_number ?? null,
    isDropped: Boolean(q.is_dropped),
    questionText: cleanNewlines(q.question_text),
    questionTextHi: blankToNull(q.question_text_hi),
    layoutText: blankToNull(q.layout_text),
    layoutTextHi: blankToNull(q.layout_text_hi),
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

// Cycle ids as stored in the database (e.g. "December_2025").
const CYCLE_DISPLAY_NAMES: Record<string, string> = {
  June_2024_Cancelled: 'June 2024 (cancelled exam, 18 June)',
};

export function getCycleDisplayName(cycleId: string) {
  if (CYCLE_DISPLAY_NAMES[cycleId]) return CYCLE_DISPLAY_NAMES[cycleId];
  const [month, year] = cycleId.split('_');
  if (month && year) return `${month} ${year} Cycle`;
  return cycleId.replace(/_/g, ' ');
}

// Sort cycles newest first ("December_2025" before "June_2025").
export function cycleSortKey(cycleId: string) {
  const [month, year] = cycleId.split('_');
  const m = month?.toLowerCase().startsWith('dec') ? 12 : month?.toLowerCase().startsWith('jun') ? 6 : 0;
  return Number(year || 0) * 100 + m;
}

export function getPaperDisplayName(paperId: string) {
  return paperId.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}
