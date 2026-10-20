-- Database speed fixes from the Supabase performance advisor (20 Oct 2026).
-- 1. Add an index for each of the 18 foreign keys that had none, so joins and
--    deletes on these columns do not scan the whole table as the data grows.
-- 2. Rewrite 5 row-level security rules so auth.uid() is worked out once per
--    query instead of once per row. Who can see what does NOT change.
-- No data is changed or deleted.

begin;

-- 1. Indexes for foreign keys
create index if not exists attempt_answers_question_id_idx        on public.attempt_answers (question_id);
create index if not exists class_members_user_id_idx              on public.class_members (user_id);
create index if not exists class_tasks_class_id_idx               on public.class_tasks (class_id);
create index if not exists classes_teacher_id_idx                 on public.classes (teacher_id);
create index if not exists course_attempt_answers_question_id_idx on public.course_attempt_answers (question_id);
create index if not exists course_attempts_set_id_idx             on public.course_attempts (set_id);
create index if not exists course_attempts_task_id_idx            on public.course_attempts (task_id);
create index if not exists course_attempts_user_id_idx            on public.course_attempts (user_id);
create index if not exists course_sets_chapter_no_idx             on public.course_sets (chapter_no);
create index if not exists polity_test_attempts_paper_id_idx      on public.polity_test_attempts (paper_id);
create index if not exists report_issues_question_id_idx          on public.report_issues (question_id);
create index if not exists report_issues_user_id_idx              on public.report_issues (user_id);
create index if not exists revision_queue_question_id_idx         on public.revision_queue (question_id);
create index if not exists task_results_user_id_idx               on public.task_results (user_id);
create index if not exists test_sessions_folder_id_idx            on public.test_sessions (folder_id);
create index if not exists test_sessions_submission_id_idx        on public.test_sessions (submission_id);
create index if not exists test_submissions_user_id_idx           on public.test_submissions (user_id);
create index if not exists vault_items_question_id_idx            on public.vault_items (question_id);

-- 2. Same rules as before, with auth.uid() wrapped in a select
alter policy "Users can insert own attempts" on public.polity_test_attempts
  with check ((select auth.uid()) = user_id);
alter policy "Users can view own attempts" on public.polity_test_attempts
  using ((select auth.uid()) = user_id);
alter policy "Users can insert their own reports" on public.report_issues
  with check ((select auth.uid()) = user_id);
alter policy "Users can read their own reports" on public.report_issues
  using ((select auth.uid()) = user_id);
alter policy "Users can read own submissions" on public.test_submissions
  using ((select auth.uid()) = user_id);

commit;

-- VERIFY: both numbers should be 0
select
  (select count(*) from pg_constraint c
     where c.contype = 'f' and c.connamespace = 'public'::regnamespace
       and not exists (select 1 from pg_index i
                       where i.indrelid = c.conrelid and (i.indkey::int2[])[0] = c.conkey[1])) as foreign_keys_without_index,
  (select count(*) from pg_policies
     where schemaname = 'public'
       and tablename in ('polity_test_attempts', 'report_issues', 'test_submissions')
       and coalesce(qual, '') || coalesce(with_check, '') like '%auth.uid() =%') as slow_rules_left;
