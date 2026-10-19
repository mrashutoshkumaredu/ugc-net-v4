import { supabase } from './supabase';

// Wrappers for the class and task functions (supabase/migrations/20261019_08_classes_and_tasks.sql).

export type TaskKind = 'FULL' | 'UNIT' | 'SPEED';
export type TaskResult = {
  user_id?: string;
  score_percentage: number | null;
  correct: number | null;
  total: number | null;
  stars: number | null;
  points: number | null;
  completed_at: string;
};
export type ClassTask = {
  id: string;
  title: string;
  kind: TaskKind;
  paper_id: string | null;
  unit: string | null;
  topic: string | null;
  question_count: number | null;
  drill: string | null;
  target_stars: number | null;
  due_on: string | null;
};
export type Person = { user_id: string; email: string; name: string };
export type ClassRole = { teacher_status: 'pending' | 'approved' | 'rejected' | null; is_admin: boolean };

function friendly(error: { message?: string } | null, fallback: string) {
  const m = error?.message || '';
  if (m.includes('login_required')) return 'Please log in first.';
  if (m.includes('bad_code')) return 'No class has that code. Please check it with your teacher.';
  if (m.includes('not_teacher')) return 'Only approved teachers can do this.';
  if (m.includes('not_admin')) return 'Only admins can do this.';
  if (m.includes('not_found')) return 'This could not be found.';
  if (m.toLowerCase().includes('failed to fetch')) return "Couldn't reach the server. Check your internet connection.";
  return m ? `${fallback} (${m.slice(0, 120)})` : fallback;
}

async function call<T>(fn: string, args: Record<string, unknown> | undefined, fallback: string): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(friendly(error, fallback));
  return data as T;
}

export const classesApi = {
  role: () => call<ClassRole>('my_class_role', undefined, 'Could not load your role.'),
  requestTeacher: () => call<void>('request_teacher', undefined, 'Could not send the request.'),
  adminListTeachers: () => call<(Person & { status: string; requested_at: string })[]>('admin_list_teachers', undefined, 'Could not load teacher requests.'),
  adminSetTeacher: (userId: string, approve: boolean) => call<void>('admin_set_teacher', { p_user: userId, p_approve: approve }, 'Could not save.'),

  createClass: (name: string) => call<string>('create_class', { p_name: name }, 'Could not create the class.'),
  deleteClass: (id: string) => call<void>('delete_class', { p_class: id }, 'Could not delete the class.'),
  teacherClasses: () => call<{ id: string; name: string; join_code: string; students: number; tasks: number }[]>('teacher_classes', undefined, 'Could not load your classes.'),
  classDetail: (id: string) => call<{
    class: { id: string; name: string; join_code: string };
    students: (Person & { joined_at: string })[];
    invites: string[];
    tasks: (ClassTask & { results: TaskResult[] })[];
  }>('class_detail', { p_class: id }, 'Could not load the class.'),
  invite: (id: string, emails: string[]) => call<number>('invite_students', { p_class: id, p_emails: emails }, 'Could not add the emails.'),
  remove: (id: string, userId: string | null, email: string | null) => call<void>('remove_from_class', { p_class: id, p_user: userId, p_email: email }, 'Could not remove.'),
  createTask: (id: string, t: Omit<ClassTask, 'id'>) => call<string>('create_task', {
    p_class: id, p_title: t.title, p_kind: t.kind, p_paper_id: t.paper_id, p_unit: t.unit, p_topic: t.topic,
    p_count: t.question_count, p_drill: t.drill, p_target_stars: t.target_stars, p_due_on: t.due_on,
  }, 'Could not create the task.'),
  deleteTask: (taskId: string) => call<void>('delete_task', { p_task: taskId }, 'Could not delete the task.'),

  joinClass: (code: string) => call<{ id: string; name: string }>('join_class', { p_code: code }, 'Could not join the class.'),
  myInvites: () => call<{ class_id: string; name: string; teacher: string }[]>('my_invites', undefined, 'Could not load invites.'),
  answerInvite: (id: string, accept: boolean) => call<void>('answer_invite', { p_class: id, p_accept: accept }, 'Could not answer the invite.'),
  leaveClass: (id: string) => call<void>('leave_class', { p_class: id }, 'Could not leave the class.'),
  mine: () => call<{ classes: { id: string; name: string; teacher: string }[]; tasks: (ClassTask & { class_name: string; result: TaskResult | null })[] }>('my_classes_and_tasks', undefined, 'Could not load your tasks.'),
  completeTestTask: (taskId: string, submissionId: number) => call<void>('complete_test_task', { p_task: taskId, p_submission: submissionId }, 'Could not record the task.'),
  completeSpeedTask: (taskId: string, stars: number, points: number) => call<void>('complete_speed_task', { p_task: taskId, p_stars: stars, p_points: points }, 'Could not record the task.'),
};

// Link to start a task.
export function taskHref(t: ClassTask) {
  if (t.kind === 'FULL') return `/quiz?mode=FULL&paperId=${encodeURIComponent(t.paper_id || '')}&task=${t.id}`;
  if (t.kind === 'UNIT') {
    const p = new URLSearchParams({ mode: 'UNIT', theme: t.unit || '', count: String(t.question_count || 10), task: t.id });
    if (t.topic) p.set('topic', t.topic);
    return `/quiz?${p.toString()}`;
  }
  return `/speed-math?drill=${encodeURIComponent(t.drill || '')}&task=${t.id}`;
}

// The task a running test belongs to survives the redirect to ?session=… in this tab.
const key = (sessionId: string) => `task-for-session:${sessionId}`;
export function rememberTaskForSession(sessionId: string, taskId: string) {
  try { window.sessionStorage.setItem(key(sessionId), taskId); } catch { /* ignore */ }
}
export function taskForSession(sessionId: string) {
  try { return window.sessionStorage.getItem(key(sessionId)); } catch { return null; }
}
