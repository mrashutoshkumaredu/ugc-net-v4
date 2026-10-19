-- Economics 20 Jun 2023 Shift 1, Q43 (id 1687): dropped by NTA, the five "C" principles have no official source.
-- Author's decision (19 Oct): rewrite the five statements from NEP 2020 para 4.28. Options unchanged. Answer: option 3.

begin;

update public.questions
set question_text = 'Which of the following are listed among the basic human and Constitutional values to be developed in students, according to NEP 2020 (para 4.28)?<br>A. Seva<br>B. Ahimsa<br>C. Competition<br>D. Satya<br>E. Nishkam karma<br>Choose the most appropriate answer from the options given below:',
    correct_option = 2,
    ai_hint = 'Officially dropped by NTA. The official question asked which of these are the encompassing principles underlying the successful implementation of value education: A. Conviction, B. Connection, C. Critical Thinking, D. Commitment, E. Courage. No official document (NEP 2020, UGC or NCERT guidelines) lists these five principles, so no option could be shown to be right. We have rewritten the statements from NEP 2020, which asks that students develop basic human and Constitutional values "such as seva, ahimsa, swachchhata, satya, nishkam karma, shanti, sacrifice, tolerance, diversity, pluralism" and others. Seva, Ahimsa, Satya and Nishkam karma are in this list, and Competition is not, so option (3) A, B, D and E only is correct. Reference: National Education Policy 2020, Ministry of Education, para 4.28. Original question: UGC NET June 2023, Economics (20 June 2023, Shift 1), Paper 1, Q43, dropped in the NTA final answer key.'
where id = 1687 and is_dropped and correct_option = -1;

commit;

-- VERIFY: expect correct_option = 2, is_dropped = true
select id, is_dropped, correct_option, left(question_text, 120) as question_start from public.questions where id = 1687;
