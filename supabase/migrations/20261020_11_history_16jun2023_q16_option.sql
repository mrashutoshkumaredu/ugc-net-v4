-- History 16 Jun 2023 Shift 2, Q16 ("Communication about communication is called -"). Approved 20 Oct 2026.
-- NTA's English printed "Communication narrative" as both option 1 and option 2 (a typo).
-- NTA's Hindi shows option 2 is a different term (संचार अधिव्याप्ति), so English option 2 becomes "Communication pervasiveness".
-- Answer unchanged (option 4, Metacommunication).
begin;

update public.questions set option_b = 'Communication pervasiveness'
where paper_id = 'HISTORY_16_JUN_2023_SHIFT2' and question_number = 16 and option_b = option_a;

commit;

-- VERIFY: expect 1 row with option_b = Communication pervasiveness and correct_option = 3
select question_number, option_a, option_b, option_c, option_d, correct_option
from public.questions where paper_id = 'HISTORY_16_JUN_2023_SHIFT2' and question_number = 16;
