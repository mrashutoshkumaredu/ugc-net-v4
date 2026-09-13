// Full row shape as stored in Supabase `questions` — includes the answer
// key. Only ever read server-side (app/api/*); never sent to the browser
// before a submission is scored.
export type Question = {
  id: number;
  paper_id: string;
  cycle: string | null;
  unit: string | null;
  question_text: string;
  question_text_hi: string | null;
  layout_text: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_a_hi: string | null;
  option_b_hi: string | null;
  option_c_hi: string | null;
  option_d_hi: string | null;
  correct_option: number;
  ai_hint: string | null;
};

// What /api/questions returns to the browser — same shape, minus the
// answer key and hint, so a user can't read them from the network tab
// before submitting.
export type PublicQuestion = Omit<Question, 'correct_option' | 'ai_hint'>;

// Normalized shape the UI actually renders (mirrors the old app.js mapping).
export type NormalizedQuestion = {
  id: number;
  paperId: string;
  cycle: string;
  unit: string;
  questionText: string;
  questionTextHi: string | null;
  layoutText: string | null;
  options: string[];
  optionsHi: string[] | null;
};

export type ExamMode = 'FULL' | 'UNIT';

export type ExamConfig = {
  mode: ExamMode;
  paperId?: string;
  theme?: string;
  questionCount?: number;
  durationSeconds: number;
};

export type UnitBreakdown = Record<string, { total: number; correct: number }>;

export type TestSubmission = {
  id: number;
  user_id: string | null;
  user_email: string | null;
  student_name: string | null;
  paper_id: string;
  test_mode: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  time_taken_seconds: number;
  unit_breakdown: UnitBreakdown | null;
  submitted_at: string;
};

export type SubmitResult = {
  correctCount: number;
  totalQuestions: number;
  scorePercentage: number;
  unitBreakdown: UnitBreakdown;
  answerKey: Record<number, { correctOption: number; aiHint: string | null }>;
  saved: boolean;
  loggedIn: boolean;
};

export type ReportIssueType =
  | 'Wrong Answer Key'
  | 'Typo / Formatting Error'
  | 'Incomplete Question Text'
  | 'Other';
