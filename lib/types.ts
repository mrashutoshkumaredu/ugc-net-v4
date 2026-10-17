// Full row shape as stored in Supabase `questions` — includes the answer
// key. Browsers can no longer read `correct_option` / `ai_hint`; only the
// database functions in supabase/migrations see them. Kept for the pure
// scoring helper and its tests.
export type Question = {
  id: number;
  paper_id: string;
  cycle: string | null;
  unit: string | null;
  question_text: string;
  question_text_hi: string | null;
  layout_text: string | null;
  layout_text_hi: string | null;
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
  question_number?: number | null;
  is_dropped?: boolean;
};

// What `start_test` / `resume_test` return for each question — no answer key.
export type PublicQuestion = Omit<Question, 'correct_option' | 'ai_hint'>;

// Normalized shape the UI renders.
export type NormalizedQuestion = {
  id: number;
  paperId: string;
  cycle: string;
  unit: string;
  questionNumber: number | null;
  isDropped: boolean;
  questionText: string;
  questionTextHi: string | null;
  layoutText: string | null;
  layoutTextHi: string | null;
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

// Returned by the `get_catalog` database function (no answers).
export type Catalog = {
  total: number;
  papers: { paper_id: string; cycle: string | null; question_count: number }[];
  units: { unit: string; question_count: number }[];
};

// Returned by `start_test` and `resume_test`.
export type TestSession = {
  session_id: string;
  mode: ExamMode;
  paper_id: string | null;
  unit: string | null;
  duration_seconds: number;
  started_at: string;
  server_now: string;
  questions: PublicQuestion[];
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

// Returned by `submit_test`.
export type SubmitResult = {
  correctCount: number;
  totalQuestions: number;
  droppedCount: number;
  scorePercentage: number;
  timeTakenSeconds: number;
  unitBreakdown: UnitBreakdown;
  answerKey: Record<number, { correctOption: number; aiHint: string | null; isDropped: boolean }>;
  saved: boolean;
  loggedIn: boolean;
};

export type ReportIssueType =
  | 'Wrong Answer Key'
  | 'Typo / Formatting Error'
  | 'Incomplete Question Text'
  | 'Other';

// Returned by `admin_list_reports` (admin only, includes the answer key).
export type AdminReport = {
  id: string;
  issue_type: string;
  comment: string | null;
  status: string;
  created_at: string;
  user_email: string | null;
  question: {
    id: number;
    paper_id: string;
    cycle: string | null;
    unit: string | null;
    question_number: number | null;
    is_dropped: boolean;
    question_text: string;
    layout_text: string | null;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: number;
    ai_hint: string | null;
  };
};
