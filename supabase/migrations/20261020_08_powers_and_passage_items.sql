-- Approved 20 Oct 2026.
-- A. Powers typed with ^ shown as raised text (<sup>), 7 rows. Numbers unchanged.
--    Economics 29 Jun 2025 S2 Q23, Q24 | Education 03 Jan 2026 S2 Q24 (EN + HI) | German 29 Jun 2025 S1 Q24 | Bodo 28 Jun 2025 S1 Q23
-- B. Political Science 15 Jun 2023: a question's own A-E items had been stuck onto the end of the shared passage.
--    S1 Q47 and S2 Q46, 47, 50: the items move back into the question. S2 Q48: a stray copy of Q46's items is removed from its passage.
--    Every row of each set then shows the same passage. No words change.
begin;

-- A. Powers: ^(...) first, then ^number
update public.questions set
  question_text = regexp_replace(regexp_replace(question_text, '\^\(([^()]*)\)', '<sup>\1</sup>', 'g'), '\^([0-9.½⅓¼¾⅔]+)', '<sup>\1</sup>', 'g')
where id in (669, 670, 2433, 620, 521) and question_text like '%^%';
update public.questions_hindi set
  question_text = regexp_replace(regexp_replace(question_text, '\^\(([^()]*)\)', '<sup>\1</sup>', 'g'), '\^([0-9.½⅓¼¾⅔]+)', '<sup>\1</sup>', 'g')
where id = 923 and question_text like '%^%';

-- B. Passage items, Shift 1 (shared passage = Q46's)
update public.questions q set
  question_text = q.question_text || '<br>' || replace(regexp_replace(substr(q.layout_text, length(b.base) + 1), '^(<br>)+', ''), '<br><br>Choose', '<br>Choose'),
  layout_text = b.base
from (select layout_text as base from public.questions where paper_id = 'POLITICAL_SCIENCE_15_JUN_2023_SHIFT1' and question_number = 46) b
where q.paper_id = 'POLITICAL_SCIENCE_15_JUN_2023_SHIFT1' and q.question_number = 47
  and left(q.layout_text, length(b.base)) = b.base and length(q.layout_text) > length(b.base);

-- B. Shift 2 (shared passage = Q49's). Q46, 47, 50 get their items back.
update public.questions q set
  question_text = q.question_text || '<br>' || replace(regexp_replace(substr(q.layout_text, length(b.base) + 1), '^(<br>)+', ''), '<br><br>Choose', '<br>Choose'),
  layout_text = b.base
from (select layout_text as base from public.questions where paper_id = 'POLITICAL_SCIENCE_15_JUN_2023_SHIFT2' and question_number = 49) b
where q.paper_id = 'POLITICAL_SCIENCE_15_JUN_2023_SHIFT2' and q.question_number in (46, 47, 50)
  and left(q.layout_text, length(b.base)) = b.base and length(q.layout_text) > length(b.base);

-- Q48 already has its own items in the question. Only the stray copy is dropped from its passage.
update public.questions q set layout_text = b.base
from (select layout_text as base from public.questions where paper_id = 'POLITICAL_SCIENCE_15_JUN_2023_SHIFT2' and question_number = 49) b
where q.paper_id = 'POLITICAL_SCIENCE_15_JUN_2023_SHIFT2' and q.question_number = 48
  and left(q.layout_text, length(b.base)) = b.base and length(q.layout_text) > length(b.base);

commit;

-- VERIFY 1: expect 0 rows (no ^ left outside $...$ maths)
select 'EN' as lang, id from public.questions where id in (669, 670, 2433, 620, 521) and question_text like '%^%'
union all select 'HI', id from public.questions_hindi where id = 923 and question_text like '%^%';

-- VERIFY 2: expect one row per shift, with versions = 1
select paper_id, count(distinct layout_text) as versions from public.questions
where paper_id in ('POLITICAL_SCIENCE_15_JUN_2023_SHIFT1', 'POLITICAL_SCIENCE_15_JUN_2023_SHIFT2') and question_number between 46 and 50
group by paper_id;
