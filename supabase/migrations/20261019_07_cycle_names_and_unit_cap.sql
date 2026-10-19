-- 1. Exam cycle names: some papers were saved as "Dec 2023" / "Dec 2025", others as "December_2023" / "December_2025".
--    The site showed them as two separate cycles. Use one name for each cycle.
-- 2. Unit-wise practice: allow more than 200 questions in one test, so "all questions in a unit" works.

begin;

update public.questions set cycle = 'December_2023' where cycle = 'Dec 2023';
update public.questions set cycle = 'December_2025' where cycle = 'Dec 2025';
update public.questions_hindi set cycle = 'December_2023' where cycle = 'Dec 2023';
update public.questions_hindi set cycle = 'December_2025' where cycle = 'Dec 2025';

-- Raise the per-test question limit in start_test from 200 to 1000 (only that number changes).
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.start_test(text,text,text,integer,text,uuid)'::regprocedure);
  if position('least(coalesce(p_count, 10), 200)' in v_def) = 0 then
    raise exception 'start_test does not contain the expected 200 limit, nothing changed';
  end if;
  execute replace(v_def, 'least(coalesce(p_count, 10), 200)', 'least(coalesce(p_count, 10), 1000)');
end $$;

commit;

-- VERIFY: cycles should be December_2023, December_2025, June_2023, June_2024_Cancelled, June_2025 only. Last row: true.
select cycle, count(distinct paper_id) as papers from public.questions group by cycle order by cycle;
select position('least(coalesce(p_count, 10), 1000)' in pg_get_functiondef('public.start_test(text,text,text,integer,text,uuid)'::regprocedure)) > 0 as limit_raised;
