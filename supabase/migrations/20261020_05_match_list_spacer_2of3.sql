-- Match the List: remove the empty spacer column (batch 2 of 3: Bodo 28 Jun 2025, Q30, Q35, Q40, Q45).
-- Same change as 20261020_04: drop the empty middle column (<th></th>, <td></td>) and use the
-- house table format. No words, options or answers change. No typed Hindi rows exist for these.

begin;

update public.questions
set layout_text = replace(replace(replace(layout_text,
      '<th></th>', ''),
      '<td></td>', ''),
      '<table border="1" style="border-collapse: collapse; width: 100%;">', '<table border="1" width="100%" cellpadding="6">')
where id in (527, 532, 537, 542);

commit;

-- VERIFY: expect 4 rows, all false / false / true
select id, question_number,
       layout_text ~* '<t[dh][^>]*>\s*</t[dh]>' as still_has_empty_cell,
       layout_text like '%style=%' as still_has_style,
       layout_text like '<table border="1" width="100%" cellpadding="6">%' as house_format
from public.questions where id in (527, 532, 537, 542) order by id;
