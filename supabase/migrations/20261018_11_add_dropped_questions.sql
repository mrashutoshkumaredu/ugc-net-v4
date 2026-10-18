-- Add 11 NTA-dropped questions that were skipped during extraction (approved 18 Oct 2026).
-- Each is marked dropped (2 marks for everyone) and carries an explanation with the original wording and a reference.
-- Step 1 numbers the existing questions of each paper, so the new ones sit in their right place in Full Test.
-- (The current id order of each paper matches the PDF order, checked against the answer keys.)

-- Safety: make sure the id counter is past the highest id (other sessions load papers with fixed ids).
select setval('public.questions_id_seq', (select max(id) from public.questions));

with o as (select id, row_number() over (order by id) rn from public.questions where paper_id = '09_EDUCATION_25_JUN_2025_SHIFT1')
update public.questions x set question_number = (array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,42,43,44,45,46,47,48,49,50])[o.rn]
  from o where x.id = o.id and x.question_number is null
   and (select count(*) from public.questions where paper_id = '09_EDUCATION_25_JUN_2025_SHIFT1') = 49;

with o as (select id, row_number() over (order by id) rn from public.questions where paper_id = '03_PHILOSOPHY_25_JUN_2025_SHIFT2')
update public.questions x set question_number = (array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,40,41,42,43,44,45,46,47,48,49,50])[o.rn]
  from o where x.id = o.id and x.question_number is null
   and (select count(*) from public.questions where paper_id = '03_PHILOSOPHY_25_JUN_2025_SHIFT2') = 49;

with o as (select id, row_number() over (order by id) rn from public.questions where paper_id = '02_POLITICAL_SCIENCE_26_JUN_2025_SHIFT2')
update public.questions x set question_number = (array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,40,41,42,43,44,45,46,47,48,49,50])[o.rn]
  from o where x.id = o.id and x.question_number is null
   and (select count(*) from public.questions where paper_id = '02_POLITICAL_SCIENCE_26_JUN_2025_SHIFT2') = 49;

with o as (select id, row_number() over (order by id) rn from public.questions where paper_id = '40_SPANISH_27_JUN_2025_SHIFT2')
update public.questions x set question_number = (array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50])[o.rn]
  from o where x.id = o.id and x.question_number is null
   and (select count(*) from public.questions where paper_id = '40_SPANISH_27_JUN_2025_SHIFT2') = 49;

with o as (select id, row_number() over (order by id) rn from public.questions where paper_id = '94_BODO_28_JUN_2025_SHIFT1')
update public.questions x set question_number = (array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50])[o.rn]
  from o where x.id = o.id and x.question_number is null
   and (select count(*) from public.questions where paper_id = '94_BODO_28_JUN_2025_SHIFT1') = 49;

with o as (select id, row_number() over (order by id) rn from public.questions where paper_id = '18_MAITHILI_28_JUN_2025_SHIFT2')
update public.questions x set question_number = (array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50])[o.rn]
  from o where x.id = o.id and x.question_number is null
   and (select count(*) from public.questions where paper_id = '18_MAITHILI_28_JUN_2025_SHIFT2') = 49;

with o as (select id, row_number() over (order by id) rn from public.questions where paper_id = '17_MANAGEMENT_16_JUN_2023_SHIFT1')
update public.questions x set question_number = (array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50])[o.rn]
  from o where x.id = o.id and x.question_number is null
   and (select count(*) from public.questions where paper_id = '17_MANAGEMENT_16_JUN_2023_SHIFT1') = 49;

with o as (select id, row_number() over (order by id) rn from public.questions where paper_id = 'HISTORY_16_JUN_2023_SHIFT2')
update public.questions x set question_number = (array[1,2,3,4,5,6,7,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50])[o.rn]
  from o where x.id = o.id and x.question_number is null
   and (select count(*) from public.questions where paper_id = 'HISTORY_16_JUN_2023_SHIFT2') = 49;

with o as (select id, row_number() over (order by id) rn from public.questions where paper_id = 'GEOGRAPHY_19_JUN_2023_SHIFT2')
update public.questions x set question_number = (array[1,2,3,4,5,6,7,8,9,10,11,12,13,15,16,17,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50])[o.rn]
  from o where x.id = o.id and x.question_number is null
   and (select count(*) from public.questions where paper_id = 'GEOGRAPHY_19_JUN_2023_SHIFT2') = 48;

with o as (select id, row_number() over (order by id) rn from public.questions where paper_id = 'SPANISH_20_JUN_2023_SHIFT2')
update public.questions x set question_number = (array[1,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,37,38,39,40,41,42,43,44,45,46,47,48,49,50])[o.rn]
  from o where x.id = o.id and x.question_number is null
   and (select count(*) from public.questions where paper_id = 'SPANISH_20_JUN_2023_SHIFT2') = 45;

-- Step 2: insert the 11 questions.
insert into public.questions (paper_id, cycle, unit, topic, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select '09_EDUCATION_25_JUN_2025_SHIFT1', 'June_2025', 'Higher Education System', 'Policies, Governance, and Administration', 41, 'Which of the following are four guiding principles in the development of higher education in India?', 'Access, Authority, Equity, Equality', 'Accountability, Based on freedom, Access, Free', 'Access, Equity, Accountability, Quality', 'Assessment, Equality, Affordability, Research Oriented', 2, true, 'Officially dropped by NTA. Our answer: (3) Access, Equity, Accountability, Quality. In the official paper, option (3) read "Access, Equity, Accountability, Equality". We have corrected Equality to Quality, as it was the closest option. Access, equity, quality and accountability (together with affordability) are the foundational pillars of higher education named in the National Education Policy 2020. Reference: National Education Policy 2020, Ministry of Education, Government of India, Introduction.'
where not exists (select 1 from public.questions where paper_id = '09_EDUCATION_25_JUN_2025_SHIFT1' and question_number = 41);

insert into public.questions (paper_id, cycle, unit, topic, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select '03_PHILOSOPHY_25_JUN_2025_SHIFT2', 'June_2025', 'People, Development and Environment', 'Environmental issues', 39, 'Match the <b>LIST-I</b> with <b>LIST-II</b><br><table border="1" width="100%" cellpadding="6"><tr><th>LIST-I (Disinfectant byproducts (DBPs) of Chlorine)</th><th>LIST-II (Chemical Composition)</th></tr><tr><td>A. Dibromochloromethane</td><td>I. CHBr<sub>2</sub>Cl</td></tr><tr><td>B. Bromoform</td><td>II. CHCl<sub>3</sub></td></tr><tr><td>C. Bromodichloromethane</td><td>III. CHBrCl<sub>2</sub></td></tr><tr><td>D. Chloro form</td><td>IV. CHBr<sub>3</sub></td></tr></table>Choose the <b><i>correct</i></b> answer from the options given below:', 'A-IV, B-III, C-I, D-II', 'A-IV, B-III, C-II, D-I', 'A-I, B-IV, C-III, D-II', 'A-III, B-I, C-IV, D-II', 2, true, 'Officially dropped by NTA: none of the four original options was correct. Our answer: (3) A-I, B-IV, C-III, D-II. In the official paper, option (3) read "A-III, B-IV, C-I, D-II". We have corrected it, as it was the closest option. Dibromochloromethane has two bromine atoms and one chlorine atom (CHBr2Cl), bromoform has three bromine atoms (CHBr3), bromodichloromethane has one bromine and two chlorine atoms (CHBrCl2), and chloroform has three chlorine atoms (CHCl3). These four are the trihalomethanes formed when chlorine reacts with organic matter in water. Reference: WHO Guidelines for Drinking-water Quality, chapter on trihalomethanes.'
where not exists (select 1 from public.questions where paper_id = '03_PHILOSOPHY_25_JUN_2025_SHIFT2' and question_number = 39);

insert into public.questions (paper_id, cycle, unit, topic, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select '02_POLITICAL_SCIENCE_26_JUN_2025_SHIFT2', 'June_2025', 'People, Development and Environment', 'Natural hazards and disasters', 39, 'How much more energy is released in an earthquake whose value is 4 on Richter Scale than in an earthquake whose value is 3 on Richter Scale?', 'Twice', '10 %', 'About 32 times', '50 %', 2, true, 'Officially dropped by NTA: none of the four original options was correct. Our answer: (3) About 32 times. In the official paper, option (3) read "10 times". We have corrected it, as it was the closest option. Each whole number step on the Richter (magnitude) scale means about 10 times larger ground motion (amplitude), but about 31.6 times (roughly 32 times) more energy released. The option 10 times describes the amplitude, not the energy. Reference: USGS Earthquake Hazards Program, Earthquake Magnitude, Energy Release, and Shaking Intensity.'
where not exists (select 1 from public.questions where paper_id = '02_POLITICAL_SCIENCE_26_JUN_2025_SHIFT2' and question_number = 39);

insert into public.questions (paper_id, cycle, unit, topic, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select '40_SPANISH_27_JUN_2025_SHIFT2', 'June_2025', 'Mathematical Reasoning and Aptitude', 'Mathematical Aptitude', 21, 'What is the sum of the first 15 terms of the following series?<br>2<sup>2</sup>, 3<sup>2</sup>, 4<sup>2</sup>, 5<sup>2</sup>, ........', '1261', '1495', '1239', '1259', 1, true, 'Officially dropped by NTA: none of the four original options was correct. Our answer: (2) 1495. In the official paper, option (2) read "1240" (which is the sum of 1 squared to 15 squared). We have corrected it, as it was the closest option. The first 15 terms are 2 squared to 16 squared. Sum of squares from 1 to n is n(n+1)(2n+1)/6, so from 1 to 16 it is 16 x 17 x 33 / 6 = 1496. Removing 1 squared gives 1496 - 1 = 1495. Reference: standard formula for the sum of squares of the first n natural numbers.'
where not exists (select 1 from public.questions where paper_id = '40_SPANISH_27_JUN_2025_SHIFT2' and question_number = 21);

insert into public.questions (paper_id, cycle, unit, topic, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select '94_BODO_28_JUN_2025_SHIFT1', 'June_2025', 'Mathematical Reasoning and Aptitude', 'Mathematical Aptitude', 24, 'Identify the correct statements.<br>A. 3 successive discounts of 20%, 25% and 20% are equivalent to a single discount of 65%.<br>B. The value of ∛343 × √196 is equal to 98<br>C. A movement of 180° by minute hand results in 30° movement of hour hand<br>D. The total surface area of a solid cube of side 5 cm is 150 cm<sup>2</sup><br>Choose the <b>correct</b> answer from the options given below :', 'A, B and C Only', 'B and C Only', 'A, C and D Only', 'B and D Only', 3, true, 'Officially dropped by NTA. Our answer: (4) B and D Only. In the official paper, statement B read "The value of ∛743 × √196 is equal to 98". 743 is not a perfect cube, so we have corrected it to ∛343, which is clearly what was meant. A is false: 0.80 x 0.75 x 0.80 = 0.48, so the single discount is 52%, not 65%. B is true: ∛343 = 7 and √196 = 14, and 7 x 14 = 98. C is false: 180° of the minute hand is 30 minutes, in which the hour hand moves 15°. D is true: 6 x 5 x 5 = 150 cm². Reference: basic arithmetic and mensuration.'
where not exists (select 1 from public.questions where paper_id = '94_BODO_28_JUN_2025_SHIFT1' and question_number = 24);

insert into public.questions (paper_id, cycle, unit, topic, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select '18_MAITHILI_28_JUN_2025_SHIFT2', 'June_2025', 'Logical Reasoning', 'Understanding the structure of arguments', 29, 'If the proposition ''No reptiles are squirrels'' is given as false, then which of the following propositions can be inferred to be true?<br>A. Some reptiles are squirrels<br>B. All reptiles are squirrels<br>C. Some non-squirrels are not non-reptiles<br>D. Some reptiles are not squirrels<br>Choose the <b>most appropriate</b> answer from the options given below :', 'A Only', 'B Only', 'C and D Only', 'A, C and D Only', 0, true, 'Officially dropped by NTA: none of the four original options was correct. Our answer: (1) A Only. In the official paper, option (1) read "A and B Only". We have corrected it, as it was the closest option. ''No reptiles are squirrels'' is an E proposition. By the square of opposition, if E is false its contradictory I (''Some reptiles are squirrels'') must be true, so A is true. The A proposition (B) and the O proposition (D) are undetermined. C (''Some non-squirrels are not non-reptiles'') is the contrapositive of the O proposition, so it is also undetermined. Reference: Irving M. Copi, Introduction to Logic, chapter on categorical propositions and the square of opposition.'
where not exists (select 1 from public.questions where paper_id = '18_MAITHILI_28_JUN_2025_SHIFT2' and question_number = 29);

insert into public.questions (paper_id, cycle, unit, topic, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select '17_MANAGEMENT_16_JUN_2023_SHIFT1', 'June_2023', 'Mathematical Reasoning and Aptitude', 'Number series, Letter series, Codes and Relationships', 22, 'A family consists of a husband and wife, their 3 daughters and 2 sons and their 2 wives. How many males and females respectively are there in this family?', '5 and 4', '3 and 6', '4 and 5', '6 and 3', 1, true, 'Officially dropped by NTA. Our answer: (2) 3 and 6. In the official paper, the question read "...their 3 daughters and 2 sons and their 3 wives". Two sons cannot have three wives, so we have corrected it to "2 wives". Males: husband + 2 sons = 3. Females: wife + 3 daughters + 2 sons'' wives = 6. Reference: simple counting of family members.'
where not exists (select 1 from public.questions where paper_id = '17_MANAGEMENT_16_JUN_2023_SHIFT1' and question_number = 22);

insert into public.questions (paper_id, cycle, unit, topic, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select 'HISTORY_16_JUN_2023_SHIFT2', 'June_2023', 'Teaching Aptitude', 'Teaching Support System', 8, 'Match List I with List II<br><table border="1" width="100%" cellpadding="6"><tr><th>LIST I (Online Tools)</th><th>LIST II (Functions)</th></tr><tr><td>A. Edpuzzle</td><td>I. Live polling & feedback</td></tr><tr><td>B. Mindmeister</td><td>II. Content Creation</td></tr><tr><td>C. Google Docs</td><td>III. Mind Mapping</td></tr><tr><td>D. Mentimeter</td><td>IV. Interactive Videos</td></tr></table>Choose the correct answer from the options given below:', 'A-III, B-II, C-IV, D-I', 'A-IV, B-III, C-II, D-I', 'A-II, B-IV, C-I, D-III', 'A-I, B-III, C-II, D-IV', 1, true, 'Officially dropped by NTA: none of the four original options was correct. Our answer: (2) A-IV, B-III, C-II, D-I. In the official paper, option (2) read "A-IV, B-III, C-I, D-II". We have corrected it, as it was the closest option. Edpuzzle adds questions to videos (interactive videos), Mindmeister is a mind-mapping tool, Google Docs is used to create and share content, and Mentimeter is used for live polls and feedback. Reference: the official descriptions of each tool on edpuzzle.com, mindmeister.com, docs.google.com and mentimeter.com.'
where not exists (select 1 from public.questions where paper_id = 'HISTORY_16_JUN_2023_SHIFT2' and question_number = 8);

insert into public.questions (paper_id, cycle, unit, topic, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select 'GEOGRAPHY_19_JUN_2023_SHIFT2', 'June_2023', 'Research Aptitude', 'Steps of Research', 14, 'For a negatively skewed distribution, the median would be equal to which of the following measures?<br>A. Mean<br>B. Mode<br>C. Second quartile<br>D. Fifth quartile<br>E. 50<sup>th</sup> percentile<br>Choose the most appropriate answer from the options given below:', 'A, B and C only', 'B, C and D only', 'C and E only', 'A, B, C, D and E', 2, true, 'Officially dropped by NTA: none of the four original options was correct. Our answer: (3) C and E only. In the official paper, option (3) read "C, D and E only". We have corrected it, as it was the closest option. The median always equals the second quartile and the 50th percentile, whatever the shape of the distribution. There is no fifth quartile (there are only three quartiles). In a skewed distribution the mean, median and mode are different, so the median does not equal the mean or the mode. Reference: S.C. Gupta, Fundamentals of Statistics, chapters on measures of central tendency and partition values.'
where not exists (select 1 from public.questions where paper_id = 'GEOGRAPHY_19_JUN_2023_SHIFT2' and question_number = 14);

insert into public.questions (paper_id, cycle, unit, topic, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select 'GEOGRAPHY_19_JUN_2023_SHIFT2', 'June_2023', 'Communication', 'Effective communication', 18, 'Which of the following are emphasized in high-context cultures?<br>A. Use of Colloquialism<br>B. Fractured sentences<br>C. Politeness in communication<br>D. Non-verbal communication<br>E. Indirect phrasings<br>Choose the correct answer from the options given below:', 'A, B C only', 'B, C, D only', 'C, D, E only', 'A, B, E only', 2, true, 'Officially dropped by NTA. Our answer: (3) C, D, E only. In the official paper, option (3) read "C, D, E only B", with a stray letter B at the end. We have removed it. In high-context cultures much of the meaning is carried by the situation and the relationship rather than the words, so they emphasise politeness, non-verbal cues and indirect phrasing. Reference: Edward T. Hall, Beyond Culture (1976).'
where not exists (select 1 from public.questions where paper_id = 'GEOGRAPHY_19_JUN_2023_SHIFT2' and question_number = 18);

insert into public.questions (paper_id, cycle, unit, topic, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, is_dropped, ai_hint)
select 'SPANISH_20_JUN_2023_SHIFT2', 'June_2023', 'People, Development and Environment', 'Natural and energy resources', 36, 'The total power output in a hydroelectric installation depends upon<br>A. the total water flow<br>B. the electrical conductivity of water<br>C. atmospheric temperature<br>D. vertical distance through which water falls<br>Choose the correct answer from the options given below:', 'A, B and C only', 'B and C only', 'A and D only', 'A, B and D only', 2, true, 'Officially dropped by NTA. Our answer: (3) A and D only. In the official paper, statement D read "aertical distance through which water falls". We have corrected the typo to "vertical". The power from a hydroelectric plant is P = ρgQh: it depends on the flow of water (Q) and the height through which it falls (h, the head). The conductivity of water and the air temperature do not matter. Reference: NCERT Class 10 Science, chapter Sources of Energy.'
where not exists (select 1 from public.questions where paper_id = 'SPANISH_20_JUN_2023_SHIFT2' and question_number = 36);

-- Check: question counts per paper (Spanish 20 Jun 2023 stays at 46 until Q2-Q5 are decided).
select paper_id, count(*), count(question_number) numbered, count(*) filter (where is_dropped) dropped
  from public.questions
 where paper_id in ('09_EDUCATION_25_JUN_2025_SHIFT1','03_PHILOSOPHY_25_JUN_2025_SHIFT2','02_POLITICAL_SCIENCE_26_JUN_2025_SHIFT2','40_SPANISH_27_JUN_2025_SHIFT2','94_BODO_28_JUN_2025_SHIFT1','18_MAITHILI_28_JUN_2025_SHIFT2','17_MANAGEMENT_16_JUN_2023_SHIFT1','HISTORY_16_JUN_2023_SHIFT2','GEOGRAPHY_19_JUN_2023_SHIFT2','SPANISH_20_JUN_2023_SHIFT2')
 group by paper_id order by paper_id;