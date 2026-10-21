import type { TestSession } from './types';

const MONTHS: Record<string, string> = {
  JAN: 'Jan', FEB: 'Feb', MAR: 'Mar', APR: 'Apr', MAY: 'May', JUN: 'Jun',
  JUL: 'Jul', AUG: 'Aug', SEP: 'Sep', OCT: 'Oct', NOV: 'Nov', DEC: 'Dec',
};

const titleWord = (w: string) => (w.length <= 1 ? w : w[0].toUpperCase() + w.slice(1).toLowerCase());

// Joining words stay lowercase inside a subject name: "Social Medicine and Community Health".
const SMALL_WORDS = new Set(['AND', 'OF', 'THE', 'IN', 'FOR', 'TO', 'ON']);

// Some stored paper ids (June 2023) lack the NTA subject code that every other cycle has.
// Codes are fixed per subject, so they are filled in for display only; the stored ids are unchanged.
const SUBJECT_CODES: Record<string, string> = {
  'POLITICAL SCIENCE': '02',
  'HISTORY': '06',
  'COMMERCE': '08',
  'EDUCATION': '09',
  'ENGLISH': '30',
  'SPANISH': '40',
  'GEOGRAPHY': '80',
};

// "30_ENGLISH_06_DEC_2023_SHIFT1" -> "30 English · 06 Dec 2023 · Shift 1"
// Works for the older ids too, e.g. "31_DEC_2025_MORNING" -> "31 Dec 2025 · Morning".
export function formatPaperTitle(paperId: string): string {
  const parts = paperId
    .toUpperCase()
    .replace(/_?QUESTION_PAPER$/, '')
    .split(/[_\s-]+/)
    .filter(Boolean);

  // Find the date: DD MON YYYY.
  const i = parts.findIndex((p, k) => /^\d{1,2}$/.test(p) && MONTHS[parts[k + 1]] && /^\d{4}$/.test(parts[k + 2] || ''));
  if (i === -1) return parts.map(titleWord).join(' ');

  const subjectParts = parts.slice(0, i);
  // One stored id has a stray "N" before the subject code (N16_MUSIC...). Show it as 16 Music, like every other numbered paper.
  if (subjectParts.length > 0 && /^N\d{2}$/.test(subjectParts[0])) subjectParts[0] = subjectParts[0].slice(1);
  if (subjectParts.length > 0 && !/^[A-Z]?\d+$/.test(subjectParts[0])) {
    const code = SUBJECT_CODES[subjectParts.join(' ')];
    if (code) subjectParts.unshift(code);
  }
  const subject = subjectParts.map((w, k) => (k > 0 && SMALL_WORDS.has(w) ? w.toLowerCase() : titleWord(w))).join(' ');
  const date = `${parts[i].padStart(2, '0')} ${MONTHS[parts[i + 1]]} ${parts[i + 2]}`;
  const rest = parts
    .slice(i + 3)
    .map((p) => {
      const m = p.match(/^SHIFT(\d+)$/);
      if (m) return `Shift ${m[1]}`;
      if (p === 'EEVENING') return 'Evening'; // typo in one stored paper id
      return titleWord(p);
    })
    .join(' ');

  return [subject, date, rest].filter(Boolean).join(' · ');
}

// The name shown above the question while a test is running.
export function testTitle(session: TestSession | null, questionCount: number): string {
  if (!session) return '';
  const qs = `${questionCount} Qs`;
  const label = session.label || '';

  switch (session.mode) {
    case 'FULL':
      return `Full Paper · ${formatPaperTitle(session.paper_id || '')} · ${qs}`;
    case 'UNIT':
      if (session.topic) return `Topic Practice · ${session.unit || 'All units'} › ${session.topic} · ${qs}`;
      return `Unit Practice · ${session.unit || 'All units'} · ${qs}`;
    case 'DAILY':
      return `Daily Practice · ${label.replace(/^Daily Practice\s*/, '') || 'Today'} · ${qs}`;
    case 'VAULT':
      return `Revision Vault · ${label.replace(/^Vault:\s*/, '') || 'Saved questions'} · ${qs}`;
    default:
      return label ? `${label} · ${qs}` : qs;
  }
}

// Saved test names come from the database as "Full Test (01 ECONOMICS 12 DEC 2023 SHIFT1)".
// Show them as "Full Paper · 01 Economics · 12 Dec 2023 · Shift 1".
export function formatTestLabel(label: string | null | undefined): string {
  if (!label) return '';
  const m = label.match(/^Full Test \((.+)\)$/);
  return m ? `Full Paper · ${formatPaperTitle(m[1].replace(/ /g, '_'))}` : label;
}
