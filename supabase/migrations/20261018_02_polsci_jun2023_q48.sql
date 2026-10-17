-- Political Science, 15 Jun 2023, Shift 2: add the missing Q48 (daylight passage).
-- Officially dropped by NTA. Approved by the author on 18 Oct 2026.
--
-- Step 1: give this paper its real question numbers (1-47, 49, 50).
-- The current id order matches the PDF order exactly (checked against the key),
-- and Full Test sorts by question number, so Q48 will sit in its right place.
-- No question text, option or answer changes here.
with ordered as (
  select id, row_number() over (order by id) as rn
  from public.questions
  where paper_id = 'POLITICAL_SCIENCE_15_JUN_2023_SHIFT2'
)
update public.questions q
   set question_number = case when o.rn <= 47 then o.rn else o.rn + 1 end
  from ordered o
 where q.id = o.id
   and q.question_number is null;

-- Step 2: add Q48, with the same passage as the other four Comprehension questions.
insert into public.questions
  (paper_id, cycle, unit, topic, question_number, layout_text, question_text,
   option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select paper_id, cycle, 'Comprehension',
       'A passage of text be given. Questions be asked from the passage to be answered',
       48, layout_text,
       'India needs to manage daylight much better than it does in order to<br>A. Improve its GDP<br>B. Be more energy efficient<br>C. Increase production<br>D. Reduce its carbon foot print<br>E. Maximize the use of natural resource of sunlight<br>Choose the correct answer from the options given below:',
       'A, B & E only', 'B, C & D only', 'A, B, D & E only', 'A, C, D & E only',
       2, true,
       'Officially dropped by NTA. Our answer: (3) A, B, D & E. The passage says that using daylight better helps India be more energy efficient (B), cut its carbon footprint (D) and use the natural resource of sunlight (E). It also links poor use of daylight to a cost of 0.2% of GDP (A). Increasing production (C) is not mentioned.'
  from public.questions
 where id = 1092
   and not exists (select 1 from public.questions
                    where paper_id = 'POLITICAL_SCIENCE_15_JUN_2023_SHIFT2' and question_number = 48);

-- Check: should list 1..50 with no gaps, and Q48 marked dropped.
select count(*) as total, min(question_number), max(question_number),
       count(distinct question_number) as distinct_numbers,
       bool_or(is_dropped and question_number = 48) as q48_dropped
  from public.questions
 where paper_id = 'POLITICAL_SCIENCE_15_JUN_2023_SHIFT2';
