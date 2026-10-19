-- Send questions_hindi.is_translated to the website, so Hindi mode can show a
-- "Translated by us" badge on Hindi text we translated because the official paper had none.
-- Safe to run before or after fill_missing_hindi_translated.sql (the column is added only if missing).

begin;

alter table public.questions_hindi add column if not exists is_translated boolean not null default false;

create or replace function public._session_questions(p_ids integer[])
 returns jsonb
 language sql
 stable security definer
 set search_path to ''
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', q.id, 'paper_id', q.paper_id, 'cycle', q.cycle, 'unit', q.unit, 'topic', q.topic,
      'question_number', q.question_number, 'is_dropped', q.is_dropped,
      'question_text', q.question_text, 'layout_text', q.layout_text,
      'option_a', q.option_a, 'option_b', q.option_b, 'option_c', q.option_c, 'option_d', q.option_d,
      'question_text_hi', h.question_text, 'layout_text_hi', h.layout_text,
      'option_a_hi', h.option_a, 'option_b_hi', h.option_b, 'option_c_hi', h.option_c, 'option_d_hi', h.option_d,
      'is_translated_hi', coalesce(h.is_translated, false)
    ) order by x.ord), '[]'::jsonb)
  from unnest(p_ids) with ordinality as x(id, ord)
  join public.questions q on q.id = x.id
  left join public.questions_hindi h on h.english_question_ref_id = q.id;
$function$;

commit;

-- VERIFY: lists the translated Hindi rows (0 rows until the other file has been run, then 6)
select paper_id, question_number from public.questions_hindi where is_translated order by 1, 2;
