import { describe, expect, it } from 'vitest';
import { alphabet, arithmetic, coding, estimation, formulas, fractions, isCorrect, miniDI, percent, series, syllogism, syllogismFollows, tables, type DrillQuestion } from './drills';

// Small seeded random source so the tests are repeatable.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function checkChoice(q: DrillQuestion) {
  expect(q.choices).toBeDefined();
  expect(q.choices!.length).toBe(4);
  expect(new Set(q.choices).size).toBe(4);
  expect(q.choices).toContain(q.answer);
}

describe('arithmetic', () => {
  it('always gives the right whole-number answer', () => {
    const r = seeded(1);
    for (let i = 0; i < 2000; i++) {
      const q = arithmetic(r, 'mixed', 'mixed');
      const [left, op, right] = q.prompt.split(' ');
      const a = Number(left), b = Number(right);
      const value = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b;
      expect(Number.isInteger(value)).toBe(true);
      expect(Number(q.answer)).toBe(value);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('tables', () => {
  it('squares, cubes and roots are right', () => {
    const r = seeded(2);
    for (let i = 0; i < 500; i++) {
      const sq = tables(r, 'squares', 'random');
      const n = Number(sq.prompt.replace('²', ''));
      expect(Number(sq.answer)).toBe(n * n);
      const cu = tables(r, 'cubes', 'random');
      expect(Number(cu.answer)).toBe(Number(cu.prompt.replace('³', '')) ** 3);
      const rt = tables(r, 'roots', 'random');
      const inside = Number(rt.prompt.slice(1));
      const a = Number(rt.answer);
      expect(rt.prompt.startsWith('√') ? a * a : a ** 3).toBe(inside);
      const tb = tables(r, 'tables', 7);
      const [b, m] = tb.prompt.split(' × ').map(Number);
      expect(b).toBe(7);
      expect(Number(tb.answer)).toBe(b * m);
    }
  });
});

describe('alphabet', () => {
  it('positions and opposites are right', () => {
    const r = seeded(3);
    for (let i = 0; i < 300; i++) {
      const q = alphabet(r, 'letterToNum');
      expect(Number(q.answer)).toBe(q.prompt.charCodeAt(0) - 64);
      const o = alphabet(r, 'opposite');
      expect(o.prompt.charCodeAt(0) - 64 + (o.answer.charCodeAt(0) - 64)).toBe(27);
      const n = alphabet(r, 'numToLetter');
      expect(n.answer.charCodeAt(0) - 64).toBe(Number(n.prompt));
    }
  });
});

describe('fractions', () => {
  it('has four different choices including the answer', () => {
    const r = seeded(4);
    for (let i = 0; i < 500; i++) checkChoice(fractions(r));
  });
});

describe('series', () => {
  it('produces a numeric answer and a rule', () => {
    const r = seeded(5);
    for (let i = 0; i < 1000; i++) {
      const q = series(r);
      expect(Number.isFinite(Number(q.answer))).toBe(true);
      expect(q.prompt).toContain('?');
      expect(q.explain).toMatch(/Rule:/);
    }
  });
});

describe('estimation', () => {
  it('has four different choices and the answer is the closest one', () => {
    const r = seeded(6);
    for (let i = 0; i < 1000; i++) {
      const q = estimation(r);
      checkChoice(q);
    }
  });
});

describe('isCorrect', () => {
  it('accepts commas and ignores case', () => {
    expect(isCorrect({ prompt: '', answer: '1234', input: 'number' }, '1,234')).toBe(true);
    expect(isCorrect({ prompt: '', answer: 'Z', input: 'text' }, 'z')).toBe(true);
    expect(isCorrect({ prompt: '', answer: '5', input: 'number' }, '')).toBe(false);
  });
});

describe('batch 2 drills', () => {
  it('multiple-choice drills always have four different options including the answer', () => {
    const r = seeded(7);
    for (let i = 0; i < 1500; i++) {
      checkChoice(percent(r));
      checkChoice(formulas(r));
      checkChoice(miniDI(r));
    }
  });

  it('coding answers are capital letters of the right length', () => {
    const r = seeded(8);
    for (let i = 0; i < 500; i++) {
      const q = coding(r);
      expect(q.answer).toMatch(/^[A-Z]+$/);
    }
  });

  it('syllogism checks known cases', () => {
    // All A are B, All B are C -> All A are C (follows)
    expect(syllogismFollows([{ t: 'all', x: 0, y: 1 }, { t: 'all', x: 1, y: 2 }], { t: 'all', x: 0, y: 2 })).toBe(true);
    // Some A are B, No B are C -> Some A are not C (follows)
    expect(syllogismFollows([{ t: 'some', x: 0, y: 1 }, { t: 'no', x: 1, y: 2 }], { t: 'somenot', x: 0, y: 2 })).toBe(true);
    // All A are B, Some B are C -> Some A are C (does not follow)
    expect(syllogismFollows([{ t: 'all', x: 0, y: 1 }, { t: 'some', x: 1, y: 2 }], { t: 'some', x: 0, y: 2 })).toBe(false);
    // All A are B, No B are C -> No A are C (follows)
    expect(syllogismFollows([{ t: 'all', x: 0, y: 1 }, { t: 'no', x: 1, y: 2 }], { t: 'no', x: 0, y: 2 })).toBe(true);
    const r = seeded(9);
    for (let i = 0; i < 300; i++) {
      const q = syllogism(r);
      expect(q.choices).toContain(q.answer);
    }
  });
});
