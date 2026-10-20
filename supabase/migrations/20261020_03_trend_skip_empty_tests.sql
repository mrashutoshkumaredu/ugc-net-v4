-- My Performance score chart: leave out tests where no question was answered.
-- Quick test runs that were submitted blank pulled the line down to 0% and hid
-- the real trend. Only the 'trend' part changes; everything else is as before.

begin;

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
        select s.id, s.test_mode, s.score_percentage, s.total_questions, s.correct_answers, s.submitted_at
        from public.test_submissions s
        where s.user_id = auth.uid()
          and exists (select 1 from public.attempt_answers x
                      where x.submission_id = s.id and x.chosen is not null)
        order by s.submitted_at desc limit 30) t),
    'totals', (select jsonb_build_object('attempted', count(*) filter (where chosen is not null),
                 'correct', count(*) filter (where is_correct and chosen is not null),
                 'avg_seconds', round(avg(time_seconds) filter (where time_seconds is not null), 1)) from a)
  );
$function$;

commit;

-- VERIFY: tests per user, all vs with at least one answer (the chart now uses the second)
select s.user_id is not null as has_user, count(*) as all_tests,
       count(*) filter (where exists (select 1 from public.attempt_answers x
                                      where x.submission_id = s.id and x.chosen is not null)) as tests_with_answers
from public.test_submissions s group by 1;
