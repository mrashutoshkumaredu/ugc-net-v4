-- Education 03 Jan 2026 Shift 2: Match List questions Q7, 13, 18, 25, 27, 33, 38, 45 (English and Hindi, 16 rows)
-- Each list was on one line ("LIST-I (...): A. ... B. ... C. ... D. ..."). It is split into a real table (layout_text), word for word.
-- question_text keeps only its first line (instruction) and last line ("Choose the correct answer ...").
-- Options and answers unchanged. Approved 20 Oct 2026. Rows that already have a table are skipped, so running it twice is safe.
begin;

update public.questions q set question_text = x.qt, layout_text = x.tbl
from (
  select id,
    p[1] || '<br>' || p[array_length(p, 1)] as qt,
    '<table border="1" width="100%" cellpadding="6">'
      || '<tr><th>' || a[1] || '</th><th>' || b[1] || '</th></tr>'
      || '<tr><td>A. ' || a[2] || '</td><td>I. ' || b[2] || '</td></tr>'
      || '<tr><td>B. ' || a[3] || '</td><td>II. ' || b[3] || '</td></tr>'
      || '<tr><td>C. ' || a[4] || '</td><td>III. ' || b[4] || '</td></tr>'
      || '<tr><td>D. ' || a[5] || '</td><td>IV. ' || b[5] || '</td></tr>'
      || '</table>' as tbl
  from (
    select id, p,
      regexp_match(p[2], '^(.*?):\s*A\.\s(.*?)\sB\.\s(.*?)\sC\.\s(.*?)\sD\.\s(.*)$') as a,
      regexp_match(p[3], '^(.*?):\s*I\.\s(.*?)\sII\.\s(.*?)\sIII\.\s(.*?)\sIV\.\s(.*)$') as b
    from (select id, string_to_array(question_text, '<br>') as p from public.questions
          where paper_id = '09_EDUCATION_03_JAN_2026_SHIFT2' and question_number in (7, 13, 18, 25, 27, 33, 38, 45)
            and (layout_text is null or layout_text = '')) s
  ) m
  where array_length(p, 1) = 4 and a is not null and b is not null
) x
where q.id = x.id;

update public.questions_hindi q set question_text = x.qt, layout_text = x.tbl
from (
  select id,
    p[1] || '<br>' || p[array_length(p, 1)] as qt,
    '<table border="1" width="100%" cellpadding="6">'
      || '<tr><th>' || a[1] || '</th><th>' || b[1] || '</th></tr>'
      || '<tr><td>A. ' || a[2] || '</td><td>I. ' || b[2] || '</td></tr>'
      || '<tr><td>B. ' || a[3] || '</td><td>II. ' || b[3] || '</td></tr>'
      || '<tr><td>C. ' || a[4] || '</td><td>III. ' || b[4] || '</td></tr>'
      || '<tr><td>D. ' || a[5] || '</td><td>IV. ' || b[5] || '</td></tr>'
      || '</table>' as tbl
  from (
    select id, p,
      regexp_match(p[2], '^(.*?):\s*A\.\s(.*?)\sB\.\s(.*?)\sC\.\s(.*?)\sD\.\s(.*)$') as a,
      regexp_match(p[3], '^(.*?):\s*I\.\s(.*?)\sII\.\s(.*?)\sIII\.\s(.*?)\sIV\.\s(.*)$') as b
    from (select id, string_to_array(question_text, '<br>') as p from public.questions_hindi
          where paper_id = '09_EDUCATION_03_JAN_2026_SHIFT2' and question_number in (7, 13, 18, 25, 27, 33, 38, 45)
            and (layout_text is null or layout_text = '')) s
  ) m
  where array_length(p, 1) = 4 and a is not null and b is not null
) x
where q.id = x.id;

commit;

-- VERIFY: expect 16 rows, each rows_in_table = 5
select 'EN' as lang, question_number, (length(layout_text) - length(replace(layout_text, '<tr>', ''))) / 4 as rows_in_table, question_text
from public.questions where paper_id = '09_EDUCATION_03_JAN_2026_SHIFT2' and question_number in (7, 13, 18, 25, 27, 33, 38, 45)
union all
select 'HI', question_number, (length(layout_text) - length(replace(layout_text, '<tr>', ''))) / 4, question_text
from public.questions_hindi where paper_id = '09_EDUCATION_03_JAN_2026_SHIFT2' and question_number in (7, 13, 18, 25, 27, 33, 38, 45)
order by 2, 1;
