import { supabase } from './supabase';
import type {
  AdminReport, Catalog, Confidence, ExamMode, LeaderboardRow, MistakeTag, Performance, Progress,
  ReviewData, SubmitResult, TestSession, Trends, UnitNote, VaultFolder,
} from './types';

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
  if (msg.includes('folder_not_found')) return 'This folder could not be found.';
  if (msg.includes('duplicate key') || msg.includes('unique')) return 'A folder with this name already exists.';
  if (msg.toLowerCase().includes('failed to fetch')) return "Couldn't reach the server. Check your internet connection and try again.";
  return fallback;
}

export async function getCatalog(): Promise<Catalog> {
  const { data, error } = await supabase.rpc('get_catalog');
  if (error) throw new Error(friendly(error, 'Could not load the question bank.'));
  return data as Catalog;
}

export async function startTest(
  mode: ExamMode,
  opts: { paperId?: string; unit?: string; topic?: string; folderId?: string; count?: number }
): Promise<TestSession> {
  const { data, error } = await supabase.rpc('start_test', {
    p_mode: mode,
    p_paper_id: opts.paperId ?? null,
    p_unit: opts.unit ?? null,
    p_count: opts.count ?? 10,
    p_topic: opts.topic ?? null,
    p_folder_id: opts.folderId ?? null,
  });
  if (error) throw new Error(friendly(error, 'Could not start the test.'));
  return data as TestSession;
}

export async function resumeTest(sessionId: string): Promise<TestSession | null> {
  const { data, error } = await supabase.rpc('resume_test', { p_session_id: sessionId });
  if (error) throw new Error(friendly(error, 'Could not load your test.'));
  return (data as TestSession | null) ?? null;
}

export async function submitTest(
  sessionId: string,
  answers: Record<number, number>,
  meta: Record<number, { conf?: Confidence; t?: number }> = {}
): Promise<SubmitResult> {
  const { data, error } = await supabase.rpc('submit_test', { p_session_id: sessionId, p_answers: answers, p_meta: meta });
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

// ---- Deep Review ---------------------------------------------------------------
export async function getReview(submissionId: number): Promise<ReviewData> {
  const { data, error } = await supabase.rpc('get_review', { p_submission_id: submissionId });
  if (error) throw new Error(friendly(error, 'Could not load this review.'));
  return data as ReviewData;
}

export async function setMistakeTag(submissionId: number, questionId: number, tag: MistakeTag | null): Promise<void> {
  const { error } = await supabase.rpc('set_mistake_tag', { p_submission_id: submissionId, p_question_id: questionId, p_tag: tag });
  if (error) throw new Error(friendly(error, 'Could not save the reason.'));
}

// ---- Revision Vault (own rows, protected by row-level security) ------------------
export async function listVaultFolders(): Promise<VaultFolder[]> {
  const { data, error } = await supabase
    .from('vault_folders')
    .select('id, name, kind, created_at, vault_items(count)')
    .order('kind', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw new Error(friendly(error, 'Could not load your vault.'));
  return (data ?? []).map((f: { id: string; name: string; kind: VaultFolder['kind']; created_at: string; vault_items?: { count: number }[] }) => ({
    id: f.id,
    name: f.name,
    kind: f.kind,
    created_at: f.created_at,
    item_count: f.vault_items?.[0]?.count ?? 0,
  }));
}

export async function createVaultFolder(name: string): Promise<VaultFolder> {
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('vault_folders')
    .insert({ name: name.trim(), user_id: auth.user?.id })
    .select('id, name, kind, created_at')
    .single();
  if (error) throw new Error(friendly(error, 'Could not create the folder.'));
  return data as VaultFolder;
}

export async function renameVaultFolder(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('vault_folders').update({ name: name.trim() }).eq('id', id);
  if (error) throw new Error(friendly(error, 'Could not rename the folder.'));
}

export async function deleteVaultFolder(id: string): Promise<void> {
  const { error } = await supabase.from('vault_folders').delete().eq('id', id);
  if (error) throw new Error(friendly(error, 'Could not delete the folder.'));
}

export async function listVaultItems(folderId: string): Promise<{ question_id: number; added_at: string; question: { id: number; paper_id: string; unit: string | null; question_number: number | null; question_text: string } | null }[]> {
  const { data, error } = await supabase
    .from('vault_items')
    .select('question_id, added_at, question:questions(id, paper_id, unit, question_number, question_text)')
    .eq('folder_id', folderId)
    .order('added_at', { ascending: false });
  if (error) throw new Error(friendly(error, 'Could not load this folder.'));
  return (data ?? []) as unknown as Awaited<ReturnType<typeof listVaultItems>>;
}

export async function addToVault(folderId: string, questionId: number): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('vault_items')
    .upsert({ folder_id: folderId, question_id: questionId, user_id: auth.user?.id }, { onConflict: 'folder_id,question_id', ignoreDuplicates: true });
  if (error) throw new Error(friendly(error, 'Could not save to the vault.'));
}

export async function removeFromVault(folderId: string, questionId: number): Promise<void> {
  const { error } = await supabase.from('vault_items').delete().eq('folder_id', folderId).eq('question_id', questionId);
  if (error) throw new Error(friendly(error, 'Could not remove the question.'));
}

// ---- Performance, leaderboard, progress -----------------------------------------
export async function getMyPerformance(): Promise<Performance> {
  const { data, error } = await supabase.rpc('get_my_performance');
  if (error) throw new Error(friendly(error, 'Could not load your performance.'));
  return data as Performance;
}

export async function getLeaderboard(paperId: string | null): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc('get_leaderboard', { p_paper_id: paperId });
  if (error) throw new Error(friendly(error, 'Could not load the leaderboard.'));
  return (data as LeaderboardRow[]) ?? [];
}

export async function getMyProgress(): Promise<Progress | null> {
  const { data, error } = await supabase.rpc('get_my_progress');
  if (error) return null;
  return (data as Progress | null) ?? null;
}

export async function saveMySettings(examDate: string | null, showOnLeaderboard: boolean): Promise<void> {
  const { error } = await supabase.rpc('save_my_settings', { p_exam_date: examDate, p_show_on_leaderboard: showOnLeaderboard });
  if (error) throw new Error(friendly(error, 'Could not save your settings.'));
}

// ---- Public: trends and notes -------------------------------------------------------
export async function getTrends(): Promise<Trends> {
  const { data, error } = await supabase.rpc('get_trends');
  if (error) throw new Error(friendly(error, 'Could not load the trends.'));
  return data as Trends;
}

export async function listPublishedNotes(unit?: string): Promise<UnitNote[]> {
  let q = supabase.from('unit_notes').select('id, unit, title, body, sort_order, status, updated_at')
    .eq('status', 'published').order('sort_order').order('title');
  if (unit) q = q.eq('unit', unit);
  const { data, error } = await q;
  if (error) throw new Error(friendly(error, 'Could not load the notes.'));
  return (data as UnitNote[]) ?? [];
}

export async function adminListNotes(): Promise<UnitNote[]> {
  const { data, error } = await supabase.rpc('admin_list_notes');
  if (error) throw new Error(friendly(error, 'Could not load the notes.'));
  return (data as UnitNote[]) ?? [];
}

export async function adminSaveNote(n: Pick<UnitNote, 'unit' | 'title' | 'body' | 'sort_order' | 'status'> & { id?: string | null }): Promise<string> {
  const { data, error } = await supabase.rpc('admin_save_note', {
    p_id: n.id ?? null, p_unit: n.unit, p_title: n.title, p_body: n.body, p_sort_order: n.sort_order, p_status: n.status,
  });
  if (error) throw new Error(friendly(error, 'Could not save the note.'));
  return data as string;
}

export async function adminDeleteNote(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_note', { p_id: id });
  if (error) throw new Error(friendly(error, 'Could not delete the note.'));
}
