-- Catalogue: also report, per paper, how many questions have typed Hindi text,
-- so the practice page can mark papers that are available in English and Hindi.
-- Only adds a field to get_catalog(); nothing else changes.
create or replace function public.get_catalog() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'total', (select count(*) from public.questions),
    'papers', (select coalesce(jsonb_agg(p order by p.cycle, p.paper_id), '[]'::jsonb) from (
        select q.paper_id, q.cycle, count(*) as question_count,
               count(*) filter (where coalesce(h.question_text, '') <> '') as hindi_text_count
        from public.questions q
        left join public.questions_hindi h on h.english_question_ref_id = q.id
        group by q.paper_id, q.cycle) p),
    'units', (select coalesce(jsonb_agg(u), '[]'::jsonb) from (
        select unit, count(*) as question_count from public.questions
        where unit is not null and not is_dropped group by unit) u),
    'topics', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select unit, topic, count(*) as question_count from public.questions
        where topic is not null and not is_dropped group by unit, topic) t)
  );
$$;
