-- Political Science 06 Jan 2026 Shift 1: Match List questions Q10, 15, 20, 35, 40, 45 (English and Hindi, 12 rows)
-- The "A | I" lines move into a real table (layout_text), word for word.
-- question_text keeps only its first line (the instruction) and its last line ("Choose the correct answer ...").
-- Options and answers unchanged. Approved 20 Oct 2026.
-- Only rows that still have exactly 5 "|" lines (heading + A-D) are touched, so running it twice is safe.
begin;

update public.questions q set question_text = x.qt, layout_text = x.tbl
from (
  select id,
    (string_to_array(question_text, '<br>'))[1] || '<br>' ||
      (select l from unnest(string_to_array(question_text, '<br>')) with ordinality u(l, o) where btrim(l) <> '' order by o desc limit 1) as qt,
    '<table border="1" width="100%" cellpadding="6">' ||
      (select string_agg(case when rn = 1
                then '<tr><th>' || btrim(split_part(l, ' | ', 1)) || '</th><th>' || btrim(split_part(l, ' | ', 2)) || '</th></tr>'
                else '<tr><td>' || btrim(split_part(l, ' | ', 1)) || '</td><td>' || btrim(split_part(l, ' | ', 2)) || '</td></tr>' end, '' order by o)
         from (select l, o, row_number() over (order by o) rn
                 from unnest(string_to_array(question_text, '<br>')) with ordinality u(l, o) where l like '% | %') p)
      || '</table>' as tbl
  from public.questions
  where paper_id = '02_POLITICAL_SCIENCE_06_JAN_2026_SHIFT1' and question_number in (10, 15, 20, 35, 40, 45)
    and (select count(*) from unnest(string_to_array(question_text, '<br>')) l where l like '% | %') = 5
) x
where q.id = x.id;

update public.questions_hindi q set question_text = x.qt, layout_text = x.tbl
from (
  select id,
    (string_to_array(question_text, '<br>'))[1] || '<br>' ||
      (select l from unnest(string_to_array(question_text, '<br>')) with ordinality u(l, o) where btrim(l) <> '' order by o desc limit 1) as qt,
    '<table border="1" width="100%" cellpadding="6">' ||
      (select string_agg(case when rn = 1
                then '<tr><th>' || btrim(split_part(l, ' | ', 1)) || '</th><th>' || btrim(split_part(l, ' | ', 2)) || '</th></tr>'
                else '<tr><td>' || btrim(split_part(l, ' | ', 1)) || '</td><td>' || btrim(split_part(l, ' | ', 2)) || '</td></tr>' end, '' order by o)
         from (select l, o, row_number() over (order by o) rn
                 from unnest(string_to_array(question_text, '<br>')) with ordinality u(l, o) where l like '% | %') p)
      || '</table>' as tbl
  from public.questions_hindi
  where paper_id = '02_POLITICAL_SCIENCE_06_JAN_2026_SHIFT1' and question_number in (10, 15, 20, 35, 40, 45)
    and (select count(*) from unnest(string_to_array(question_text, '<br>')) l where l like '% | %') = 5
) x
where q.id = x.id;

commit;

-- VERIFY: expect 12 rows, each rows_in_table = 5 and pipe_left = false
select 'EN' as lang, question_number, (length(layout_text) - length(replace(layout_text, '<tr>', ''))) / 4 as rows_in_table,
       question_text like '% | %' as pipe_left, question_text
from public.questions where paper_id = '02_POLITICAL_SCIENCE_06_JAN_2026_SHIFT1' and question_number in (10, 15, 20, 35, 40, 45)
union all
select 'HI', question_number, (length(layout_text) - length(replace(layout_text, '<tr>', ''))) / 4,
       question_text like '% | %', question_text
from public.questions_hindi where paper_id = '02_POLITICAL_SCIENCE_06_JAN_2026_SHIFT1' and question_number in (10, 15, 20, 35, 40, 45)
order by 2, 1;
