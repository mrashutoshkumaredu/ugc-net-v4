import { supabase } from './supabase';
import type { AdminReport, Catalog, ExamMode, SubmitResult, TestSession } from './types';

// Thin wrappers around the database functions (see supabase/migrations).
// The browser never reads the answer key directly: `start_test` and
// `resume_test` return questions without it, and `submit_test` scores on
// the server, saves the attempt, and only then returns the key.

function friendly(error: { message?: string } | null, fallback: string) {
  const msg = error?.message || '';
  if (msg.includes('login_required')) return 'Please log in to take a test.';
  if (msg.includes('no_questions')) return 'No questions are available for this selection yet.';
  if (msg.includes('already_submitted')) return 'This test has already been submitted.';
  if (msg.includes('session_not_found')) return 'This test could not be found. Please start a new one.';
  if (msg.includes('not_admin')) return 'Only admins can open this page.';
  if (msg.toLowerCase().includes('failed to fetch')) return "Couldn't reach the server. Check your internet connection and try again.";
  return fallback;
}

export async function getCatalog(): Promise<Catalog> {
  const { data, error } = await supabase.rpc('get_catalog');
  if (error) throw new Error(friendly(error, 'Could not load the question bank.'));
  return data as Catalog;
}

export async function startTest(mode: ExamMode, opts: { paperId?: string; unit?: string; count?: number }): Promise<TestSession> {
  const { data, error } = await supabase.rpc('start_test', {
    p_mode: mode,
    p_paper_id: opts.paperId ?? null,
    p_unit: opts.unit ?? null,
    p_count: opts.count ?? 10,
  });
  if (error) throw new Error(friendly(error, 'Could not start the test.'));
  return data as TestSession;
}

export async function resumeTest(sessionId: string): Promise<TestSession | null> {
  const { data, error } = await supabase.rpc('resume_test', { p_session_id: sessionId });
  if (error) throw new Error(friendly(error, 'Could not load your test.'));
  return (data as TestSession | null) ?? null;
}

export async function submitTest(sessionId: string, answers: Record<number, number>): Promise<SubmitResult> {
  const { data, error } = await supabase.rpc('submit_test', { p_session_id: sessionId, p_answers: answers });
  if (error) throw new Error(friendly(error, 'Could not submit the test.'));
  return data as SubmitResult;
}

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return Boolean(data);
}

export async function adminListReports(status: string | null): Promise<AdminReport[]> {
  const { data, error } = await supabase.rpc('admin_list_reports', { p_status: status });
  if (error) throw new Error(friendly(error, 'Could not load reports.'));
  return (data as AdminReport[]) ?? [];
}

export async function adminUpdateQuestion(q: AdminReport['question']): Promise<void> {
  const { error } = await supabase.rpc('admin_update_question', {
    p_id: q.id,
    p_question_text: q.question_text,
    p_layout_text: q.layout_text ?? '',
    p_option_a: q.option_a,
    p_option_b: q.option_b,
    p_option_c: q.option_c,
    p_option_d: q.option_d,
    p_correct_option: q.correct_option,
    p_ai_hint: q.ai_hint ?? '',
    p_unit: q.unit,
    p_is_dropped: q.is_dropped,
  });
  if (error) throw new Error(friendly(error, 'Could not save the question.'));
}

export async function adminSetReportStatus(reportId: string, status: string): Promise<void> {
  const { error } = await supabase.rpc('admin_set_report_status', { p_id: reportId, p_status: status });
  if (error) throw new Error(friendly(error, 'Could not update the report.'));
}
