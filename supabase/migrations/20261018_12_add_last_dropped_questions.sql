-- Add the last 6 NTA-dropped questions (approved 18 Oct 2026).
-- Education 19 Jun 2023 Q21 and Economics 20 Jun 2023 Q43: dropped, no reliable answer (correct_option = -1, everyone gets the marks).
-- Spanish 20 Jun 2023 Q2-Q5: dropped because the English table was misprinted. Answered from the correct (Hindi) table, the same one Q1 uses.

select setval('public.questions_id_seq', (select max(id) from public.questions));

with o as (select id, row_number() over (order by id) rn from public.questions where paper_id = 'EDUCATION_19_JUN_2023_SHIFT1')
update public.questions x set question_number = (array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50])[o.rn]
  from o where x.id = o.id and x.question_number is null
   and (select count(*) from public.questions where paper_id = 'EDUCATION_19_JUN_2023_SHIFT1') = 49;

with o as (select id, row_number() over (order by id) rn from public.questions where paper_id = '01_ECONOMICS_20_JUN_2023_SHIFT1')
update public.questions x set question_number = (array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,44,45,46,47,48,49,50])[o.rn]
  from o where x.id = o.id and x.question_number is null
   and (select count(*) from public.questions where paper_id = '01_ECONOMICS_20_JUN_2023_SHIFT1') = 49;

insert into public.questions (paper_id, cycle, unit, topic, question_number, layout_text, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select 'EDUCATION_19_JUN_2023_SHIFT1', 'June_2023', 'Mathematical Reasoning and Aptitude', 'Number series, Letter series, Codes and Relationships', 21, null, 'Find the correct sequence of five (5) missing letters which will complete the following letter series:<br>d c c _ ba_ad_ccba_a', 'b a c a b', 'c a c b a', 'c b c a b', 'c a c d a', -1, true, 'Officially dropped by NTA. This question has no reliable answer: it asks for five missing letters, but the series as printed (in both the English and Hindi versions) shows only four blanks, so the intended pattern cannot be worked out. Everyone gets the marks for this question.'
where not exists (select 1 from public.questions where paper_id = 'EDUCATION_19_JUN_2023_SHIFT1' and question_number = 21);

insert into public.questions (paper_id, cycle, unit, topic, question_number, layout_text, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select '01_ECONOMICS_20_JUN_2023_SHIFT1', 'June_2023', 'Higher Education System', 'Value education and environmental education', 43, null, 'Which of the following are the encompassing principles underlying the successful implementation of value education?<br>A. Conviction<br>B. Connection<br>C. Critical Thinking<br>D. Commitment<br>E. Courage<br>Choose the most appropriate answer from the options given below:', 'A, C and D only', 'B, C and E only', 'A, B, D and E only', 'A, B, C and E only', -1, true, 'Officially dropped by NTA. This question has no reliable answer: the list of five principles (conviction, connection, critical thinking, commitment, courage) does not come from any official document on value education (such as NEP 2020, UGC or NCERT guidelines), so there is no recognised source to decide which options are correct. Everyone gets the marks for this question.'
where not exists (select 1 from public.questions where paper_id = '01_ECONOMICS_20_JUN_2023_SHIFT1' and question_number = 43);

insert into public.questions (paper_id, cycle, unit, topic, question_number, layout_text, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select 'SPANISH_20_JUN_2023_SHIFT2', 'June_2023', 'Data Interpretation', 'Data Interpretation', 2, (select layout_text from public.questions where id = 1340), 'What is the percentage of Newspaper Y distribution with total distribution?', '33%', '37%', '34%', '35%', 2, true, 'Officially dropped by NTA because the table in the English version was misprinted (the second column was labelled Y instead of X, W was shown as printing 500 instead of 5000, and City 1 showed 35000 instead of 3500). The Hindi version of the same paper has the correct table, which is the one shown here (and used for Q1 of this set). Using it: Newspaper Y distributed 3500 + 3000 + 1500 + 500 = 8500 copies, out of a total distribution of 25000 copies. 8500 / 25000 x 100 = 34%. Our answer: (3) 34%.'
where not exists (select 1 from public.questions where paper_id = 'SPANISH_20_JUN_2023_SHIFT2' and question_number = 2);

insert into public.questions (paper_id, cycle, unit, topic, question_number, layout_text, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select 'SPANISH_20_JUN_2023_SHIFT2', 'June_2023', 'Data Interpretation', 'Data Interpretation', 3, (select layout_text from public.questions where id = 1340), 'Which newspaper has highest distribution?', 'Newspaper Z', 'Newspaper W', 'Newspaper Y', 'Newspaper X', 3, true, 'Officially dropped by NTA because the table in the English version was misprinted (the second column was labelled Y instead of X, W was shown as printing 500 instead of 5000, and City 1 showed 35000 instead of 3500). The Hindi version of the same paper has the correct table, which is the one shown here (and used for Q1 of this set). Using it: total distribution is W = 3500, X = 9000, Y = 8500 and Z = 4000, so X is the highest. Our answer: (4) Newspaper X.'
where not exists (select 1 from public.questions where paper_id = 'SPANISH_20_JUN_2023_SHIFT2' and question_number = 3);

insert into public.questions (paper_id, cycle, unit, topic, question_number, layout_text, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select 'SPANISH_20_JUN_2023_SHIFT2', 'June_2023', 'Data Interpretation', 'Data Interpretation', 4, (select layout_text from public.questions where id = 1340), 'What is the percentage of the newspapers which are not distributed to any city?', '~ 15.2', '~ 16.7', '~ 17.7', '~ 14.7', 1, true, 'Officially dropped by NTA because the table in the English version was misprinted (the second column was labelled Y instead of X, W was shown as printing 500 instead of 5000, and City 1 showed 35000 instead of 3500). The Hindi version of the same paper has the correct table, which is the one shown here (and used for Q1 of this set). Using it: total printed = 5000 + 10000 + 10000 + 5000 = 30000, and total distributed = 25000. Not distributed = 5000, and 5000 / 30000 x 100 = 16.7%. Our answer: (2) ~16.7.'
where not exists (select 1 from public.questions where paper_id = 'SPANISH_20_JUN_2023_SHIFT2' and question_number = 4);

insert into public.questions (paper_id, cycle, unit, topic, question_number, layout_text, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select 'SPANISH_20_JUN_2023_SHIFT2', 'June_2023', 'Data Interpretation', 'Data Interpretation', 5, (select layout_text from public.questions where id = 1340), 'What is the average number of newspapers distributed in each city?', '6200', '6250', '1200', '6230', 1, true, 'Officially dropped by NTA because the table in the English version was misprinted (the second column was labelled Y instead of X, W was shown as printing 500 instead of 5000, and City 1 showed 35000 instead of 3500). The Hindi version of the same paper has the correct table, which is the one shown here (and used for Q1 of this set). Using it: the four cities together received 25000 newspapers, so the average per city is 25000 / 4 = 6250. Our answer: (2) 6250.'
where not exists (select 1 from public.questions where paper_id = 'SPANISH_20_JUN_2023_SHIFT2' and question_number = 5);

-- Check: all three papers at 50, numbered 1-50.
select paper_id, count(*), count(distinct question_number) numbered, count(*) filter (where is_dropped) dropped
  from public.questions where paper_id in ('EDUCATION_19_JUN_2023_SHIFT1','01_ECONOMICS_20_JUN_2023_SHIFT1','SPANISH_20_JUN_2023_SHIFT2')
 group by paper_id order by paper_id;