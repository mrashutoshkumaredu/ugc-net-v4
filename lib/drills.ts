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
  // Small data table shown above the question (mini DI sets).
  table?: { headers: string[]; rows: (string | number)[][] };
};

export type DrillId = 'arithmetic' | 'tables' | 'alphabet' | 'fractions' | 'series' | 'estimation'
  | 'coding' | 'syllogism' | 'percent' | 'formulas' | 'minidi';

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

// ---------- 7. Letter series and coding-decoding ----------
const WORDS = ['TABLE', 'CHAIR', 'MOUSE', 'PAPER', 'GREEN', 'LIGHT', 'WATER', 'PLANT', 'HOUSE', 'TRAIN', 'MUSIC', 'BRAIN', 'CLOUD', 'SMART', 'NIGHT', 'RIVER', 'STONE', 'BREAD', 'FRUIT', 'CLOCK'];
const shiftLetter = (c: string, k: number) => A[(((A.indexOf(c) + k) % 26) + 26) % 26];
const shiftWord = (w: string, k: number) => [...w].map((c) => shiftLetter(c, k)).join('');
const reverseWord = (w: string) => [...w].map((c) => A[25 - A.indexOf(c)]).join('');

export function coding(r: Rand): DrillQuestion {
  const kind = int(r, 0, 2);
  if (kind === 0) {
    const k = pick(r, [1, 2, 3, -1, -2] as const);
    const [w1, w2] = shuffle(r, WORDS).slice(0, 2);
    const ans = shiftWord(w2, k);
    return { prompt: `${w1} → ${shiftWord(w1, k)}, so ${w2} → ?`, hint: 'Type the code', answer: ans, input: 'text', explain: `Each letter moves ${Math.abs(k)} place${Math.abs(k) > 1 ? 's' : ''} ${k > 0 ? 'forward' : 'back'}: ${w2} → ${ans}.` };
  }
  if (kind === 1) {
    const [w1, w2] = shuffle(r, WORDS).slice(0, 2);
    const ans = reverseWord(w2);
    return { prompt: `${w1} → ${reverseWord(w1)}, so ${w2} → ?`, hint: 'Type the code', answer: ans, input: 'text', explain: `Each letter is replaced by its opposite (A↔Z, B↔Y): ${w2} → ${ans}.` };
  }
  // Letter series with a fixed or growing step.
  const start = int(r, 0, 8), step = int(r, 2, 5), grow = r() < 0.4;
  const idx: number[] = [start];
  for (let k = 1; k < 6; k++) idx.push(idx[k - 1] + step + (grow ? k - 1 : 0));
  const letters = idx.map((i) => A[i % 26]);
  return {
    prompt: `${letters.slice(0, 5).join(', ')}, ?`,
    hint: 'Find the next letter',
    answer: letters[5],
    input: 'text',
    explain: grow ? `Gaps grow by one: +${step}, +${step + 1}, +${step + 2} … Next: ${letters[5]}.` : `Each letter moves ${step} places forward. Next: ${letters[5]}.`,
  };
}

// ---------- 8. Syllogism ----------
// Checked by brute force over every Venn diagram of three non-empty terms,
// so "Follows" is right only when the conclusion is true in every possible case.
type Stmt = { t: 'all' | 'some' | 'no' | 'somenot'; x: number; y: number };
const TERMS = [['cats', 'dogs', 'pets'], ['pens', 'books', 'bags'], ['doctors', 'teachers', 'singers'], ['roses', 'flowers', 'plants'], ['cars', 'buses', 'trucks'], ['apples', 'mangoes', 'fruits']];
const stmtText = (s: Stmt, n: string[]) =>
  s.t === 'all' ? `All ${n[s.x]} are ${n[s.y]}.` : s.t === 'some' ? `Some ${n[s.x]} are ${n[s.y]}.` : s.t === 'no' ? `No ${n[s.x]} are ${n[s.y]}.` : `Some ${n[s.x]} are not ${n[s.y]}.`;
function holds(s: Stmt, regions: number[]) {
  // regions: list of non-empty Venn regions, each a 3-bit mask of which terms it is in.
  const inX = (m: number) => (m >> s.x) & 1, inY = (m: number) => (m >> s.y) & 1;
  if (s.t === 'all') return !regions.some((m) => inX(m) && !inY(m));
  if (s.t === 'no') return !regions.some((m) => inX(m) && inY(m));
  if (s.t === 'some') return regions.some((m) => inX(m) && inY(m));
  return regions.some((m) => inX(m) && !inY(m));
}
export function syllogismFollows(premises: Stmt[], conclusion: Stmt) {
  for (let set = 1; set < 128; set++) {
    const regions = [1, 2, 3, 4, 5, 6, 7].filter((_, k) => (set >> k) & 1);
    const nonEmpty = [0, 1, 2].every((t) => regions.some((m) => (m >> t) & 1));
    if (!nonEmpty || !premises.every((p) => holds(p, regions))) continue;
    if (!holds(conclusion, regions)) return false;
  }
  return true;
}
export function syllogism(r: Rand): DrillQuestion {
  const names = pick(r, TERMS);
  const types = ['all', 'some', 'no'] as const;
  for (;;) {
    const p1: Stmt = { t: pick(r, types), x: 0, y: 1 };
    const p2: Stmt = { t: pick(r, types), x: 1, y: 2 };
    // Two "some" premises allow almost nothing, so skip them.
    if (p1.t === 'some' && p2.t === 'some') continue;
    const c: Stmt = { t: pick(r, ['all', 'some', 'no', 'somenot'] as const), ...(r() < 0.5 ? { x: 0, y: 2 } : { x: 2, y: 0 }) };
    const follows = syllogismFollows([p1, p2], c);
    return {
      prompt: `${stmtText(p1, names)} ${stmtText(p2, names)}`,
      hint: `Conclusion: ${stmtText(c, names)} Does it follow?`,
      answer: follows ? 'Follows' : 'Does not follow',
      input: 'choice',
      choices: ['Follows', 'Does not follow'],
      explain: follows ? 'It is true in every Venn diagram that fits both statements.' : 'At least one Venn diagram fits both statements but makes this conclusion false.',
    };
  }
}

// ---------- 9. Percentage change ----------
function choicesAround(r: Rand, answer: number, unit: string, deltas: number[]) {
  const vals = new Set<string>([`${answer}${unit}`]);
  for (const d of shuffle(r, deltas)) {
    if (vals.size === 4) break;
    const v = Math.round((answer + d) * 100) / 100;
    if (v > 0) vals.add(`${v}${unit}`);
  }
  for (let k = 1; vals.size < 4; k++) vals.add(`${Math.round(answer * (1 + 0.07 * k) * 100) / 100}${unit}`);
  return shuffle(r, [...vals]);
}
export function percent(r: Rand): DrillQuestion {
  const kind = int(r, 0, 3);
  if (kind === 0) {
    const base = pick(r, [20, 25, 40, 50, 80, 120, 160, 200, 250, 400]), p = pick(r, [10, 15, 20, 25, 30, 40, 50, 60, 75]);
    const up = r() < 0.5, b = up ? base * (1 + p / 100) : base * (1 - p / 100);
    return { prompt: `${base} → ${b}`, hint: `Percentage ${up ? 'increase' : 'decrease'}?`, answer: `${p}%`, input: 'choice', choices: choicesAround(r, p, '%', [-10, -5, 5, 10, 15, -15]), explain: `Change ${Math.abs(b - base)} ÷ ${base} × 100 = ${p}%.` };
  }
  if (kind === 1) {
    const y = pick(r, [20, 25, 40, 50, 80, 100, 200]), p = pick(r, [10, 20, 25, 50, 75]);
    const x = y * (1 + p / 100);
    const less = Math.round((p / (100 + p)) * 10000) / 100;
    if (r() < 0.5) return { prompt: `X = ${x}, Y = ${y}`, hint: 'X is what % more than Y?', answer: `${p}%`, input: 'choice', choices: choicesAround(r, p, '%', [less - p, -5, 5, 10]), explain: `(${x} − ${y}) ÷ ${y} × 100 = ${p}%. Divide by the one you compare with (Y).` };
    return { prompt: `X = ${x}, Y = ${y}`, hint: 'Y is what % less than X?', answer: `${less}%`, input: 'choice', choices: choicesAround(r, less, '%', [p - less, -5, 5, 10]), explain: `(${x} − ${y}) ÷ ${x} × 100 = ${less}%. Divide by X this time.` };
  }
  if (kind === 2) {
    const a = pick(r, [10, 20, 25, 30, 40, 50]), b = pick(r, [10, 20, 25, 30, 40, 50]);
    const net = Math.round(((1 + a / 100) * (1 - b / 100) - 1) * 10000) / 100;
    const word = net >= 0 ? 'increase' : 'decrease';
    const ans = Math.abs(net);
    const label = (v: number, w: string) => (v === 0 ? 'No change' : `${Math.round(v * 100) / 100}% ${w}`);
    const answer = label(ans, word);
    const opts = new Set([answer, label(Math.abs(a - b), a >= b ? 'increase' : 'decrease'), label(ans + 2, word), label(ans + 1, net >= 0 ? 'decrease' : 'increase')]);
    for (let k = 3; opts.size < 4; k++) opts.add(label(ans + k, word));
    return { prompt: `+${a}% then −${b}%`, hint: 'Net change?', answer, input: 'choice', choices: shuffle(r, [...opts]), explain: `${a} − ${b} − (${a} × ${b})/100 = ${net}%.` };
  }
  const p = pick(r, [10, 20, 25, 50]), orig = pick(r, [40, 80, 120, 200, 400]);
  const now = orig * (1 + p / 100);
  return { prompt: `After a ${p}% rise the value is ${now}`, hint: 'Original value?', answer: String(orig), input: 'choice', choices: choicesAround(r, orig, '', [-orig * 0.1, orig * 0.05, now * (1 - p / 100) - orig, orig * 0.1]), explain: `${now} ÷ ${1 + p / 100} = ${orig}. (Not ${now} − ${p}%.)` };
}

// ---------- 10. Quick formulas ----------
export function formulas(r: Rand): DrillQuestion {
  const kind = int(r, 0, 4);
  if (kind === 0) {
    const P = pick(r, [1000, 2000, 2500, 4000, 5000, 8000]), R = pick(r, [4, 5, 8, 10, 12]), T = int(r, 2, 5);
    const si = (P * R * T) / 100;
    return { prompt: `SI on ₹${P} at ${R}% for ${T} years`, hint: 'Simple interest?', answer: `₹${si}`, input: 'choice', choices: choicesAround(r, si, '', [si * 0.1, -si * 0.2, P * R / 100, si * 0.25]).map((c) => `₹${c}`), explain: `SI = P × R × T ÷ 100 = ${P} × ${R} × ${T} ÷ 100 = ₹${si}.` };
  }
  if (kind === 1) {
    const P = pick(r, [1000, 2000, 5000, 10000]), R = pick(r, [5, 10, 20]);
    const ci = Math.round(P * ((1 + R / 100) ** 2 - 1));
    const si = (P * R * 2) / 100;
    return { prompt: `CI on ₹${P} at ${R}% for 2 years`, hint: 'Compound interest?', answer: `₹${ci}`, input: 'choice', choices: choicesAround(r, ci, '', [si - ci, P * R / 100, Math.round(ci * 0.1)]).map((c) => `₹${c}`), explain: `CI for 2 years = SI + interest on interest = ${si} + ${P} × (${R}/100)² = ₹${ci}.` };
  }
  if (kind === 2) {
    const cp = pick(r, [200, 250, 400, 500, 800]), p = pick(r, [10, 20, 25, 40]), loss = r() < 0.3;
    const sp = cp * (1 + (loss ? -p : p) / 100);
    return { prompt: `Cost ₹${cp}, sold for ₹${sp}`, hint: `${loss ? 'Loss' : 'Profit'} %?`, answer: `${p}%`, input: 'choice', choices: choicesAround(r, p, '%', [-5, 5, 10, Math.round(((sp - cp) / sp) * 10000) / 100 - p]), explain: `${loss ? 'Loss' : 'Profit'} % = ${Math.abs(sp - cp)} ÷ cost ${cp} × 100 = ${p}%.` };
  }
  if (kind === 3) {
    const pairs = [[30, 60, 40], [40, 60, 48], [20, 30, 24], [60, 90, 72], [12, 24, 16], [30, 45, 36], [40, 120, 60]] as const;
    const [x, y, avg] = pick(r, pairs);
    return { prompt: `Goes at ${x} km/h, returns at ${y} km/h`, hint: 'Average speed for the whole trip?', answer: `${avg} km/h`, input: 'choice', choices: shuffle(r, [`${avg} km/h`, `${(x + y) / 2} km/h`, `${avg + 4} km/h`, `${avg - 3} km/h`]), explain: `Same distance both ways: average = 2xy ÷ (x + y) = 2 × ${x} × ${y} ÷ ${x + y} = ${avg} km/h, not the simple average.` };
  }
  const a = pick(r, [10, 20, 25]), b = pick(r, [10, 20, 25, 30]);
  const single = Math.round((1 - (1 - a / 100) * (1 - b / 100)) * 10000) / 100;
  return { prompt: `Discounts of ${a}% and ${b}%`, hint: 'Equal to a single discount of?', answer: `${single}%`, input: 'choice', choices: choicesAround(r, single, '%', [a + b - single, 2, -3, 5]), explain: `${a} + ${b} − (${a} × ${b})/100 = ${single}%.` };
}

// ---------- 11. Mini DI ----------
export function miniDI(r: Rand): DrillQuestion {
  const years = [2019, 2020, 2021, 2022, 2023];
  const a = years.map(() => int(r, 8, 30) * 10), b = years.map(() => int(r, 8, 30) * 10);
  const table = { headers: ['Year', 'Product A', 'Product B'], rows: years.map((y, k) => [y, a[k], b[k]]) };
  const kind = int(r, 0, 4);
  const num = (v: number) => Math.round(v * 100) / 100;
  if (kind === 0) {
    const tot = a.reduce((s, v) => s + v, 0);
    return { table, prompt: 'Total sales of Product A over the five years?', answer: String(tot), input: 'choice', choices: choicesAround(r, tot, '', [-20, 30, 50, -40, 10]), explain: `${a.join(' + ')} = ${tot}.` };
  }
  if (kind === 1) {
    const avg = num(b.reduce((s, v) => s + v, 0) / 5);
    return { table, prompt: 'Average yearly sales of Product B?', answer: String(avg), input: 'choice', choices: choicesAround(r, avg, '', [-6, 8, 12, -10, 4]), explain: `Total ${b.reduce((s, v) => s + v, 0)} ÷ 5 = ${avg}.` };
  }
  if (kind === 2) {
    const i = int(r, 0, 3);
    const ch = num(((a[i + 1] - a[i]) / a[i]) * 100);
    return { table, prompt: `Percentage change in Product A from ${years[i]} to ${years[i + 1]}?`, answer: `${ch}%`, input: 'choice', choices: choicesAround(r, ch, '%', [-5, 5, 10, -12, 8]), explain: `(${a[i + 1]} − ${a[i]}) ÷ ${a[i]} × 100 = ${ch}%.` };
  }
  if (kind === 3) {
    const tot = years.map((_, k) => a[k] + b[k]);
    const max = Math.max(...tot), y = years[tot.indexOf(max)];
    return { table, prompt: 'In which year were total sales (A + B) highest?', answer: String(y), input: 'choice', choices: shuffle(r, years.map(String)).filter((v) => v !== String(y)).slice(0, 3).concat(String(y)).sort(), explain: `Totals: ${years.map((yy, k) => `${yy}: ${tot[k]}`).join(', ')}. Highest in ${y}.` };
  }
  const i = int(r, 0, 4);
  const g = (x: number, z: number): number => (z === 0 ? x : g(z, x % z));
  const d = g(a[i], b[i]);
  const ans = `${a[i] / d} : ${b[i] / d}`;
  const wrong = [`${b[i] / d} : ${a[i] / d}`, `${a[i] / d + 1} : ${b[i] / d}`, `${a[i] / d} : ${b[i] / d + 1}`];
  return { table, prompt: `Ratio of Product A to Product B in ${years[i]}?`, answer: ans, input: 'choice', choices: (() => { const o = new Set([ans, ...wrong]); for (let k = 2; o.size < 4; k++) o.add(`${a[i] / d + k} : ${b[i] / d}`); return shuffle(r, [...o]); })(), explain: `${a[i]} : ${b[i]} = ${ans} (divide both by ${d}).` };
}
