-- Match the List: remove the empty spacer column (batch 1 of 3: Bodo 28 Jun 2025, Q10, Q15, Q20, Q25).
-- Each table had an empty middle column (<th></th> and <td></td>), which wasted space and
-- pushed List II off the screen on phones. Also replaces the table's style="" with the
-- house format (border, width, cellpadding), as the formatting checklist asks.
-- Only these four English rows change. They have no typed Hindi rows (Hindi uses NTA pictures).

begin;

update public.questions
set layout_text = replace(replace(replace(layout_text,
      '<th></th>', ''),
      '<td></td>', ''),
      '<table border="1" style="border-collapse: collapse; width: 100%;">', '<table border="1" width="100%" cellpadding="6">')
where id in (508, 513, 518, 522);

commit;

-- VERIFY: expect 4 rows, all false / false / true
select id, question_number,
       layout_text ~* '<t[dh][^>]*>\s*</t[dh]>' as still_has_empty_cell,
       layout_text like '%style=%' as still_has_style,
       layout_text like '<table border="1" width="100%" cellpadding="6">%' as house_format
from public.questions where id in (508, 513, 518, 522) order by id;
