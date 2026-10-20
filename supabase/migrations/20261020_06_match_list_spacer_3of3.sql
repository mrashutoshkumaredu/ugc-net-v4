-- Match the List: remove the empty spacer column (batch 3 of 3: Economics 29 Jun 2025, Q10).
-- Same change as 20261020_04 and _05. No words, options or answers change.

begin;

update public.questions
set layout_text = replace(replace(replace(layout_text,
      '<th></th>', ''),
      '<td></td>', ''),
      '<table border="1" style="border-collapse: collapse; width: 100%;">', '<table border="1" width="100%" cellpadding="6">')
where id = 656;

commit;

-- VERIFY: expect 1 row: false / false / true
select id, question_number,
       layout_text ~* '<t[dh][^>]*>\s*</t[dh]>' as still_has_empty_cell,
       layout_text like '%style=%' as still_has_style,
       layout_text like '<table border="1" width="100%" cellpadding="6">%' as house_format
from public.questions where id = 656;
