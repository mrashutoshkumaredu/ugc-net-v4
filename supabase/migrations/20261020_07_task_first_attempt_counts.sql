-- Class tasks: the teacher sees the student's FIRST attempt, not the best one.
-- Task questions stay the same between attempts, and the answers are shown after
-- submitting, so "best attempt" let a student submit once, read the answers and
-- then score 100%. Students can still practise again; it just no longer changes
-- the task result. Speed Math tasks keep "best", because their questions are new
-- every round. Only the "on conflict" rule changes in each function.

begin;

-- Full paper and unit test tasks
create or replace function public.complete_test_task(p_task uuid, p_submission integer)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare v_sub public.test_submissions;
begin
  if not exists (select 1 from public.class_tasks t join public.class_members m on m.class_id = t.class_id
                 where t.id = p_task and m.user_id = auth.uid() and t.kind in ('FULL', 'UNIT')) then raise exception 'not_found'; end if;
  select * into v_sub from public.test_submissions where id = p_submission and user_id = auth.uid();
  if not found then raise exception 'not_found'; end if;
  insert into public.task_results(task_id, user_id, submission_id, score_percentage, correct, total)
  values (p_task, auth.uid(), v_sub.id, v_sub.score_percentage, v_sub.correct_answers, v_sub.total_questions)
  on conflict (task_id, user_id) do nothing;
end $function$;

-- Maths Course chapter tasks
create or replace function public.course_submit_set(p_set text, p_answers jsonb, p_seconds integer default null::integer, p_task uuid default null::uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_ans jsonb := coalesce(p_answers, '{}'::jsonb);
  v_total integer; v_correct integer; v_pct numeric; v_attempt integer; v_key jsonb;
begin
  select count(*),
         count(*) filter (where (v_ans ->> q.id::text) ~ '^[0-3]$' and (v_ans ->> q.id::text)::int = q.correct_option),
         jsonb_object_agg(q.id::text, jsonb_build_object('correct', q.correct_option, 'explanation', q.explanation_html))
    into v_total, v_correct, v_key
  from public.course_questions q where q.set_id = p_set;
  if v_total = 0 then raise exception 'no_questions'; end if;
  v_pct := round(v_correct * 100.0 / v_total, 2);

  if auth.uid() is not null then
    insert into public.course_attempts(user_id, set_id, task_id, correct, total, score_percentage, time_seconds)
    values (auth.uid(), p_set, p_task, v_correct, v_total, v_pct, p_seconds) returning id into v_attempt;
    insert into public.course_attempt_answers(attempt_id, question_id, chosen, is_correct)
    select v_attempt, q.id,
           case when (v_ans ->> q.id::text) ~ '^[0-3]$' then (v_ans ->> q.id::text)::int end,
           coalesce((v_ans ->> q.id::text) ~ '^[0-3]$' and (v_ans ->> q.id::text)::int = q.correct_option, false)
    from public.course_questions q where q.set_id = p_set;

    if p_task is not null and exists (select 1 from public.class_tasks t join public.class_members m on m.class_id = t.class_id
                                      where t.id = p_task and m.user_id = auth.uid() and t.kind = 'CHAPTER' and t.set_id = p_set) then
      insert into public.task_results(task_id, user_id, submission_id, score_percentage, correct, total)
      values (p_task, auth.uid(), v_attempt, v_pct, v_correct, v_total)
      on conflict (task_id, user_id) do nothing;
    end if;
  end if;

  return jsonb_build_object('correct', v_correct, 'total', v_total, 'score_percentage', v_pct, 'key', v_key, 'saved', v_attempt is not null);
end $function$;

commit;

-- VERIFY: both should be true (first attempt kept) and the grants unchanged
select p.proname,
       pg_get_functiondef(p.oid) like '%on conflict (task_id, user_id) do nothing%' as first_attempt_counts
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('complete_test_task', 'course_submit_set')
order by 1;
