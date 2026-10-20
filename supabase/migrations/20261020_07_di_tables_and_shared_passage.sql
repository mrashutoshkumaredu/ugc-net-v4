-- Approved 20 Oct 2026.
-- A. Bodo 08 Dec 2023 Shift 2, Q1-5 (English and Hindi): the two Data Interpretation tables were "| a | b |" text lines.
--    They become real tables. Words and numbers unchanged.
-- B. Political Science 06 Jan 2026 Shift 1 (English and Hindi):
--    the DI table was only inside Q1 and the passage only inside Q46, so Q2-5 and Q47-50 showed neither.
--    The table (as a real table) and the passage move into layout_text, shared by Q1-5 and Q46-50.
--    Q1 and Q46 keep only their own question line. Words and numbers unchanged.
begin;

-- Helper (temporary, disappears after this run): turns "| a | b |" lines into an HTML table.
create function pg_temp.pipe2html(t text) returns text language plpgsql as $f$
declare
  l text; outp text := ''; intable boolean := false; firstrow boolean := false; aftertable boolean := false;
  cells text[]; c text; tag text; r text;
begin
  if t is null then return null; end if;
  foreach l in array string_to_array(t, '<br>') loop
    if btrim(l) like '|%' then
      if btrim(l) ~ '^\|[\s|:-]+$' then continue; end if;
      if not intable then
        outp := regexp_replace(outp, '(<br>)+$', '') || '<table border="1" width="100%" cellpadding="6">';
        intable := true; firstrow := true;
      end if;
      cells := string_to_array(regexp_replace(btrim(l), '^\||\|$', '', 'g'), '|');
      tag := case when firstrow then 'th' else 'td' end;
      r := '<tr>';
      foreach c in array cells loop r := r || '<' || tag || '>' || btrim(c) || '</' || tag || '>'; end loop;
      outp := outp || r || '</tr>';
      firstrow := false;
    else
      if intable then outp := outp || '</table>'; intable := false; aftertable := true; end if;
      if aftertable and btrim(l) = '' then continue; end if;
      aftertable := false;
      outp := outp || l || '<br>';
    end if;
  end loop;
  if intable then outp := outp || '</table>'; end if;
  return regexp_replace(outp, '(<br>)+$', '');
end
$f$;

-- A. Bodo DI tables
update public.questions set layout_text = pg_temp.pipe2html(layout_text)
where paper_id = '94_BODO_08_DEC_2023_SHIFT2' and question_number between 1 and 5 and layout_text like '%|---%';
update public.questions_hindi set layout_text = pg_temp.pipe2html(layout_text)
where paper_id = '94_BODO_08_DEC_2023_SHIFT2' and question_number between 1 and 5 and layout_text like '%|---%';

-- B. Political Science 06 Jan 2026: split Q1 and Q46 into shared part + own question line
create temp table ps_split as
select 'EN' as lang, question_number as n, string_to_array(question_text, '<br><br>') as parts
from public.questions
where paper_id = '02_POLITICAL_SCIENCE_06_JAN_2026_SHIFT1' and question_number in (1, 46) and coalesce(layout_text, '') = ''
union all
select 'HI', question_number, string_to_array(question_text, '<br><br>')
from public.questions_hindi
where paper_id = '02_POLITICAL_SCIENCE_06_JAN_2026_SHIFT1' and question_number in (1, 46) and coalesce(layout_text, '') = '';

create temp table ps_new as
select lang, n,
  parts[array_length(parts, 1)] as own_q,
  case when n = 1
       then pg_temp.pipe2html(array_to_string(parts[1:array_length(parts, 1) - 1], '<br><br>'))
       else '<p>' || array_to_string(parts[1:array_length(parts, 1) - 1], '</p><p>') || '</p>' end as shared
from ps_split
where array_length(parts, 1) >= 3;

update public.questions q set layout_text = s.shared
from ps_new s
where s.lang = 'EN' and q.paper_id = '02_POLITICAL_SCIENCE_06_JAN_2026_SHIFT1'
  and ((s.n = 1 and q.question_number between 1 and 5) or (s.n = 46 and q.question_number between 46 and 50));
update public.questions q set question_text = s.own_q
from ps_new s
where s.lang = 'EN' and q.paper_id = '02_POLITICAL_SCIENCE_06_JAN_2026_SHIFT1' and q.question_number = s.n;

update public.questions_hindi q set layout_text = s.shared
from ps_new s
where s.lang = 'HI' and q.paper_id = '02_POLITICAL_SCIENCE_06_JAN_2026_SHIFT1'
  and ((s.n = 1 and q.question_number between 1 and 5) or (s.n = 46 and q.question_number between 46 and 50));
update public.questions_hindi q set question_text = s.own_q
from ps_new s
where s.lang = 'HI' and q.paper_id = '02_POLITICAL_SCIENCE_06_JAN_2026_SHIFT1' and q.question_number = s.n;

commit;

-- VERIFY: expect 30 rows. Bodo 1-5 and Pol Sci 1-5: has_table = true. Pol Sci 46-50: has_passage = true. No pipe_left.
select 'EN' as lang, paper_id, question_number, layout_text like '%<table%' as has_table, layout_text like '<p>%' as has_passage,
       coalesce(layout_text, '') || question_text like '%|---%' as pipe_left, left(question_text, 70) as question_start
from public.questions
where (paper_id = '94_BODO_08_DEC_2023_SHIFT2' and question_number between 1 and 5)
   or (paper_id = '02_POLITICAL_SCIENCE_06_JAN_2026_SHIFT1' and (question_number between 1 and 5 or question_number between 46 and 50))
union all
select 'HI', paper_id, question_number, layout_text like '%<table%', layout_text like '<p>%',
       coalesce(layout_text, '') || question_text like '%|---%', left(question_text, 70)
from public.questions_hindi
where (paper_id = '94_BODO_08_DEC_2023_SHIFT2' and question_number between 1 and 5)
   or (paper_id = '02_POLITICAL_SCIENCE_06_JAN_2026_SHIFT1' and (question_number between 1 and 5 or question_number between 46 and 50))
order by 2, 3, 1;
