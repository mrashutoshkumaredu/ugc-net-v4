// Question generators for the Speed Math & Logic page.
// Pure functions (random source can be passed in) so they can be unit tested.

export type Rand = () => number;

export type DrillQuestion = {
  prompt: string;
  // Shown under the prompt in a smaller font (e.g. "Find the next number").
  hint?: string;
  answer: string;
  // 'number' and 'text' use a typed answer, 'choice' shows four buttons.
  input: 'number' | 'text' | 'choice';
  choices?: string[];
  // Shown after a wrong answer.
  explain?: string;
};

export type DrillId = 'arithmetic' | 'tables' | 'alphabet' | 'fractions' | 'series' | 'estimation';

const int = (r: Rand, min: number, max: number) => Math.floor(r() * (max - min + 1)) + min;
const pick = <T,>(r: Rand, list: readonly T[]): T => list[Math.floor(r() * list.length)];
function shuffle<T>(r: Rand, list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const fmt = (n: number) => n.toLocaleString('en-IN');

export function isCorrect(q: DrillQuestion, given: string) {
  const g = given.trim();
  if (!g) return false;
  if (q.input === 'number') return Number(g.replace(/,/g, '')) === Number(q.answer);
  return g.toUpperCase() === q.answer.toUpperCase();
}

// ---------- 1. Arithmetic ----------
export type ArithOp = 'mixed' | 'add' | 'sub' | 'mul' | 'div';
export type Digits = '1' | '2' | '3' | 'mixed';

const ofDigits = (r: Rand, d: number) => (d === 1 ? int(r, 2, 9) : int(r, 10 ** (d - 1), 10 ** d - 1));

export function arithmetic(r: Rand, op: ArithOp, digits: Digits): DrillQuestion {
  const o = op === 'mixed' ? pick(r, ['add', 'sub', 'mul', 'div'] as const) : op;
  const d = digits === 'mixed' ? int(r, 1, 3) : Number(digits);
  if (o === 'add') {
    const a = ofDigits(r, d), b = ofDigits(r, d);
    return { prompt: `${a} + ${b}`, answer: String(a + b), input: 'number' };
  }
  if (o === 'sub') {
    let a = ofDigits(r, d), b = ofDigits(r, d);
    if (b > a) [a, b] = [b, a];
    return { prompt: `${a} − ${b}`, answer: String(a - b), input: 'number' };
  }
  if (o === 'mul') {
    // Keep it mental: an n-digit number times a 1-digit (or 2-digit for 1-digit mode).
    const a = ofDigits(r, d), b = d === 1 ? int(r, 2, 9) : d === 2 ? int(r, 2, 19) : int(r, 2, 9);
    return { prompt: `${a} × ${b}`, answer: String(a * b), input: 'number' };
  }
  // Division always comes out exact.
  const divisor = d === 1 ? int(r, 2, 9) : int(r, 2, 19);
  const quotient = d === 1 ? int(r, 2, 12) : d === 2 ? int(r, 3, 25) : int(r, 12, 99);
  return { prompt: `${divisor * quotient} ÷ ${divisor}`, answer: String(quotient), input: 'number' };
}

// ---------- 2. Tables, squares, cubes, roots ----------
export type TableKind = 'tables' | 'squares' | 'cubes' | 'roots';

export function tables(r: Rand, kind: TableKind, base: number | 'random'): DrillQuestion {
  if (kind === 'tables') {
    const b = base === 'random' ? int(r, 2, 20) : base;
    const n = int(r, 1, 10);
    return { prompt: `${b} × ${n}`, answer: String(b * n), input: 'number' };
  }
  if (kind === 'squares') {
    const n = int(r, 11, 30);
    return { prompt: `${n}²`, answer: String(n * n), input: 'number' };
  }
  if (kind === 'cubes') {
    const n = int(r, 2, 20);
    return { prompt: `${n}³`, answer: String(n ** 3), input: 'number' };
  }
  if (r() < 0.6) {
    const n = int(r, 11, 30);
    return { prompt: `√${n * n}`, answer: String(n), input: 'number' };
  }
  const n = int(r, 2, 20);
  return { prompt: `∛${n ** 3}`, answer: String(n), input: 'number' };
}

// ---------- 3. Alphabet grid ----------
export type AlphaKind = 'letterToNum' | 'numToLetter' | 'opposite';
const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function alphabet(r: Rand, kind: AlphaKind): DrillQuestion {
  const i = int(r, 0, 25);
  const L = A[i];
  if (kind === 'letterToNum') {
    return { prompt: L, hint: 'Position in the alphabet (A = 1)', answer: String(i + 1), input: 'number', explain: `${L} is letter ${i + 1}. Tip: E 5, J 10, O 15, T 20, Y 25 ("EJOTY").` };
  }
  if (kind === 'numToLetter') {
    return { prompt: String(i + 1), hint: 'Which letter is at this position?', answer: L, input: 'text', explain: `Letter ${i + 1} is ${L}. Tip: E 5, J 10, O 15, T 20, Y 25 ("EJOTY").` };
  }
  const opp = A[25 - i];
  return { prompt: L, hint: 'Opposite letter (A ↔ Z, B ↔ Y)', answer: opp, input: 'text', explain: `${L} (${i + 1}) and ${opp} (${26 - i}) add up to 27.` };
}

// ---------- 4. Fractions ↔ percentages ----------
const FRACTIONS: [number, number][] = [
  [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6],
  [1, 7], [2, 7], [3, 7], [1, 8], [3, 8], [5, 8], [7, 8], [1, 9], [2, 9], [1, 11], [1, 12], [5, 12], [1, 15], [1, 16], [1, 20], [1, 25], [1, 40],
];
const pct = (n: number, d: number) => {
  const v = (n / d) * 100;
  return Number.isInteger(v) ? `${v}%` : `${(Math.round(v * 100) / 100).toFixed(2).replace(/0$/, '')}%`;
};

export function fractions(r: Rand): DrillQuestion {
  const idx = int(r, 0, FRACTIONS.length - 1);
  const [n, d] = FRACTIONS[idx];
  // Distractors: nearby fractions from the list, so the choice needs real recall.
  const others = shuffle(r, FRACTIONS.filter((_, k) => k !== idx && Math.abs(FRACTIONS[k][0] / FRACTIONS[k][1] - n / d) < 0.12));
  const pool = others.length >= 3 ? others : shuffle(r, FRACTIONS.filter((_, k) => k !== idx));
  const wrong = pool.slice(0, 3);
  if (r() < 0.5) {
    const answer = pct(n, d);
    return { prompt: `${n}/${d}`, hint: 'As a percentage', answer, input: 'choice', choices: shuffle(r, [answer, ...wrong.map(([a, b]) => pct(a, b))]), explain: `${n}/${d} = ${answer}` };
  }
  const answer = `${n}/${d}`;
  return { prompt: pct(n, d), hint: 'As a fraction', answer, input: 'choice', choices: shuffle(r, [answer, ...wrong.map(([a, b]) => `${a}/${b}`)]), explain: `${pct(n, d)} = ${n}/${d}` };
}

// ---------- 5. Number series ----------
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71];

export function series(r: Rand): DrillQuestion {
  const kind = int(r, 0, 7);
  let terms: number[] = [];
  let rule = '';
  if (kind === 0) {
    const a = int(r, 2, 30), dlt = int(r, 3, 15);
    terms = Array.from({ length: 6 }, (_, k) => a + k * dlt);
    rule = `add ${dlt} each time`;
  } else if (kind === 1) {
    const a = int(r, 1, 5), m = int(r, 2, 3);
    terms = Array.from({ length: 6 }, (_, k) => a * m ** k);
    rule = `multiply by ${m} each time`;
  } else if (kind === 2) {
    const s = int(r, 1, 8);
    terms = Array.from({ length: 6 }, (_, k) => (s + k) ** 2);
    rule = `squares: ${s}², ${s + 1}², ${s + 2}² …`;
  } else if (kind === 3) {
    const s = int(r, 1, 5), add = pick(r, [1, -1, 2] as const);
    terms = Array.from({ length: 6 }, (_, k) => (s + k) ** 2 + add);
    rule = `n² ${add > 0 ? '+' : '−'} ${Math.abs(add)} for n = ${s}, ${s + 1}, ${s + 2} …`;
  } else if (kind === 4) {
    const a = int(r, 1, 20), start = int(r, 1, 4);
    terms = [a];
    for (let k = 0; k < 5; k++) terms.push(terms[k] + start + k);
    rule = `differences grow by 1: +${start}, +${start + 1}, +${start + 2} …`;
  } else if (kind === 5) {
    const a = int(r, 1, 20), x = int(r, 2, 9), y = int(r, 2, 9);
    terms = [a];
    for (let k = 0; k < 5; k++) terms.push(terms[k] + (k % 2 === 0 ? x : y));
    rule = `alternately add ${x} and ${y}`;
  } else if (kind === 6) {
    const s = int(r, 0, PRIMES.length - 6);
    terms = PRIMES.slice(s, s + 6);
    rule = 'consecutive prime numbers';
  } else {
    const a = int(r, 1, 5), b = int(r, 1, 8);
    terms = [a, b];
    for (let k = 2; k < 6; k++) terms.push(terms[k - 1] + terms[k - 2]);
    rule = 'each term is the sum of the two before it';
  }
  // Ask for the next term, or for a missing term in the middle.
  if (r() < 0.6) {
    return { prompt: `${terms.slice(0, 5).join(', ')}, ?`, hint: 'Find the next number', answer: String(terms[5]), input: 'number', explain: `Rule: ${rule}. Next: ${terms[5]}.` };
  }
  const gap = int(r, 1, 4);
  const shown = terms.slice(0, 6).map((t, k) => (k === gap ? '?' : String(t)));
  return { prompt: shown.join(', '), hint: 'Find the missing number', answer: String(terms[gap]), input: 'number', explain: `Rule: ${rule}. Missing: ${terms[gap]}.` };
}

// ---------- 6. Estimation (for Data Interpretation) ----------
export function estimation(r: Rand): DrillQuestion {
  const kind = int(r, 0, 2);
  let prompt = '';
  let exact = 0;
  if (kind === 0) {
    const b = int(r, 110, 990), q = int(r, 2, 40) + r();
    const a = Math.round(b * q);
    prompt = `${fmt(a)} ÷ ${fmt(b)} ≈ ?`;
    exact = a / b;
  } else if (kind === 1) {
    const a = int(r, 21, 99), b = int(r, 110, 990);
    prompt = `${a} × ${fmt(b)} ≈ ?`;
    exact = a * b;
  } else {
    const p = int(r, 11, 89), b = int(r, 1100, 9900);
    prompt = `${p}% of ${fmt(b)} ≈ ?`;
    exact = (p / 100) * b;
  }
  // Four options roughly 12–25% apart. The one nearest the exact value is right.
  const round = (v: number) => (v >= 1000 ? Math.round(v / 10) * 10 : v >= 100 ? Math.round(v) : Math.round(v * 10) / 10);
  const f1 = 1 + 0.12 + r() * 0.1, f2 = f1 + 0.12 + r() * 0.1;
  const opts = shuffle(r, [exact, exact * f1, exact / f1, r() < 0.5 ? exact * f2 : exact / f2]).map(round);
  const answer = String(round(exact));
  return {
    prompt,
    hint: 'Pick the closest value. Round the numbers first.',
    answer,
    input: 'choice',
    choices: opts.map(String),
    explain: `Exact value ≈ ${fmt(Math.round(exact * 100) / 100)}, so the closest option is ${answer}.`,
  };
}
