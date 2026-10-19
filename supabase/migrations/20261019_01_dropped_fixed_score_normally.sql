-- Dropped questions that we have fixed (correct_option 0-3) now score like any other question:
-- marks only for the marked option. Only dropped questions with no answer (correct_option = -1)
-- still give everyone the marks, until each of those is fixed too.
-- Past submissions are not rescored.

begin;

create or replace function public.submit_test(p_session_id uuid, p_answers jsonb, p_meta jsonb default '{}'::jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_session public.test_sessions;
  v_total integer; v_correct integer; v_dropped integer;
  v_breakdown jsonb; v_key jsonb; v_taken integer; v_label text; v_sub_id integer; v_name text;
  v_answers jsonb := coalesce(p_answers, '{}'::jsonb);
  v_meta jsonb := coalesce(p_meta, '{}'::jsonb);
  v_wrong_folder uuid; v_lucky_folder uuid;
  v_today date := public._ist_today();
begin
  if v_uid is null then raise exception 'login_required'; end if;
  select * into v_session from public.test_sessions
   where id = p_session_id and user_id = v_uid for update;
  if not found then raise exception 'session_not_found'; end if;
  if v_session.submitted_at is not null then raise exception 'already_submitted'; end if;

  -- is_dropped here means "dropped with no answer" (marks for everyone).
  -- A dropped question we have fixed has a real answer and is scored normally.
  create temp table _scored on commit drop as
    select q.id, x.ord as position, coalesce(q.unit, 'General') as unit,
           (q.is_dropped and coalesce(q.correct_option, -1) not between 0 and 3) as is_dropped,
           q.correct_option, q.ai_hint,
           case when (v_answers ->> q.id::text) ~ '^[0-3]$' then (v_answers ->> q.id::text)::int end as chosen,
           case when (v_meta -> q.id::text ->> 'conf') = 'guess' then 'guess'
                when (v_answers ->> q.id::text) ~ '^[0-3]$' then 'sure' end as confidence,
           case when (v_meta -> q.id::text ->> 't') ~ '^[0-9]{1,5}$' then (v_meta -> q.id::text ->> 't')::int end as time_seconds,
           ((q.is_dropped and coalesce(q.correct_option, -1) not between 0 and 3)
             or coalesce(case when (v_answers ->> q.id::text) ~ '^[0-3]$'
                              then (v_answers ->> q.id::text)::int = q.correct_option end, false)) as ok
    from unnest(v_session.question_ids) with ordinality as x(id, ord)
    join public.questions q on q.id = x.id;

  select count(*), count(*) filter (where ok), count(*) filter (where is_dropped),
    (select jsonb_object_agg(b.unit, jsonb_build_object('total', b.t, 'correct', b.c)) from
       (select unit, count(*) as t, count(*) filter (where ok) as c from _scored group by unit) b),
    jsonb_object_agg(id::text, jsonb_build_object('correctOption', correct_option, 'aiHint', ai_hint, 'isDropped', is_dropped))
  into v_total, v_correct, v_dropped, v_breakdown, v_key from _scored;

  v_taken := least(v_session.duration_seconds, greatest(0, extract(epoch from now() - v_session.started_at)::int));
  v_label := coalesce(v_session.label,
               case when v_session.mode = 'FULL' then 'Full Test (' || replace(v_session.paper_id, '_', ' ') || ')'
                    else v_session.unit end);
  select coalesce(u.raw_user_meta_data ->> 'full_name', 'Student') into v_name from auth.users u where u.id = v_uid;

  insert into public.test_submissions(user_id, user_email, student_name, paper_id, test_mode, total_questions,
         correct_answers, score_percentage, time_taken_seconds, unit_breakdown)
  values (v_uid, auth.jwt() ->> 'email', v_name, coalesce(v_session.paper_id, v_session.unit, v_session.mode), v_label,
          v_total, v_correct, round(v_correct * 100.0 / nullif(v_total, 0), 2), v_taken, v_breakdown)
  returning id into v_sub_id;

  insert into public.attempt_answers(submission_id, user_id, question_id, position, chosen, is_correct, confidence, time_seconds)
  select v_sub_id, v_uid, id, position, chosen, ok, confidence, time_seconds from _scored;

  -- Vault: wrong answers, and correct answers that were guesses.
  if exists (select 1 from _scored where not ok and not is_dropped and chosen is not null) then
    v_wrong_folder := public._auto_folder(v_uid, 'wrong');
    insert into public.vault_items(folder_id, user_id, question_id)
    select v_wrong_folder, v_uid, id from _scored where not ok and not is_dropped and chosen is not null
    on conflict do nothing;
  end if;
  if exists (select 1 from _scored where ok and not is_dropped and confidence = 'guess') then
    v_lucky_folder := public._auto_folder(v_uid, 'lucky');
    insert into public.vault_items(folder_id, user_id, question_id)
    select v_lucky_folder, v_uid, id from _scored where ok and not is_dropped and confidence = 'guess'
    on conflict do nothing;
  end if;

  -- Spaced revision: wrong or guessed -> back tomorrow. Right and sure on a
  -- question in the queue -> next step (3 days, then 7 days, then done).
  insert into public.revision_queue(user_id, question_id, step, due_on)
  select v_uid, id, 1, v_today + 1 from _scored
  where not is_dropped and chosen is not null and (not ok or confidence = 'guess')
  on conflict (user_id, question_id) do update set step = 1, due_on = excluded.due_on;

  update public.revision_queue r set step = r.step + 1,
         due_on = v_today + case r.step when 1 then 3 else 7 end
  from _scored s
  where r.user_id = v_uid and r.question_id = s.id and s.ok and s.confidence = 'sure' and r.step < 3;
  delete from public.revision_queue r using _scored s
  where r.user_id = v_uid and r.question_id = s.id and s.ok and s.confidence = 'sure' and r.step >= 3
    and r.due_on <= v_today;

  update public.test_sessions set submitted_at = now(), submission_id = v_sub_id where id = v_session.id;

  return jsonb_build_object('submissionId', v_sub_id, 'correctCount', v_correct, 'totalQuestions', v_total,
    'droppedCount', v_dropped,
    'scorePercentage', coalesce(round(v_correct * 100.0 / nullif(v_total, 0), 2), 0),
    'timeTakenSeconds', v_taken, 'unitBreakdown', coalesce(v_breakdown, '{}'::jsonb),
    'answerKey', coalesce(v_key, '{}'::jsonb), 'saved', true, 'loggedIn', true);
end $function$;

-- Performance page: leave out only the no-answer dropped questions.
create or replace function public.get_my_performance()
 returns jsonb
 language sql
 stable security definer
 set search_path to ''
as $function$
  with a as (
    select a.*, coalesce(q.unit, 'General') as unit
    from public.attempt_answers a join public.questions q on q.id = a.question_id
    where a.user_id = auth.uid()
      and not (q.is_dropped and coalesce(q.correct_option, -1) not between 0 and 3)
  )
  select jsonb_build_object(
    'units', (select coalesce(jsonb_agg(u order by u.accuracy), '[]'::jsonb) from (
        select unit, count(*) as attempted,
               count(*) filter (where is_correct) as correct,
               round(100.0 * count(*) filter (where is_correct) / nullif(count(*), 0), 1) as accuracy,
               round(avg(time_seconds) filter (where time_seconds is not null), 1) as avg_seconds
        from a where chosen is not null group by unit) u),
    'tags', (select coalesce(jsonb_object_agg(mistake_tag, n), '{}'::jsonb) from (
        select mistake_tag, count(*) as n from a where mistake_tag is not null group by mistake_tag) t),
    'guesses', (select jsonb_build_object('total', count(*), 'correct', count(*) filter (where is_correct))
                from a where confidence = 'guess'),
    'trend', (select coalesce(jsonb_agg(t order by t.submitted_at), '[]'::jsonb) from (
        select id, test_mode, score_percentage, total_questions, correct_answers, submitted_at
        from public.test_submissions where user_id = auth.uid()
        order by submitted_at desc limit 30) t),
    'totals', (select jsonb_build_object('attempted', count(*) filter (where chosen is not null),
                 'correct', count(*) filter (where is_correct and chosen is not null),
                 'avg_seconds', round(avg(time_seconds) filter (where time_seconds is not null), 1)) from a)
  );
$function$;

commit;

-- VERIFY: expect fixed = 20, no_answer = 4
select count(*) filter (where is_dropped and correct_option between 0 and 3) as fixed,
       count(*) filter (where is_dropped and coalesce(correct_option, -1) not between 0 and 3) as no_answer
from public.questions;
