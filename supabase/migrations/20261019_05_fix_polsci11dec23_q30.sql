-- Political Science 11 Dec 2023 Shift 1, Q30 (id 2339): dropped by NTA. None of the listed fallacies is the one described.
-- Author's decision (19 Oct): replace statement C (Vyapyatvasiddha) with Satpratipaksa, in English and Hindi.
-- Options unchanged. Answer: option 4, (C) only.

begin;

update public.questions
set question_text = replace(question_text, 'C. Vyāpyatvāsiddha', 'C. Satpratipakṣa'),
    correct_option = 3,
    ai_hint = 'Officially dropped by NTA. In the official paper statement C was "Vyāpyatvāsiddha", so none of the four listed fallacies matched the description and no option was right. In Nyāya, the fallacy in which the middle term (hetu) is contradicted by another middle term that proves the opposite conclusion is Satpratipakṣa, the counterbalanced reason. We have replaced statement C with Satpratipakṣa. Svarūpāsiddha and Vyāpyatvāsiddha are kinds of Asiddha (the unproved middle term), Bādhita is a middle term contradicted by another means of knowledge such as perception, and Viruddha is a middle term that proves the opposite of what it is meant to prove. So option (4), (C) only, is correct. Reference: Annambhaṭṭa, Tarkasaṃgraha, section on hetvābhāsa (fallacies of the middle term). Original question: UGC NET December 2023, Political Science (11 December 2023, Shift 1), Paper 1, Q30, dropped in the NTA final answer key.'
where id = 2339 and is_dropped and correct_option = -1
  and question_text like '%C. Vyāpyatvāsiddha%';

update public.questions_hindi
set question_text = replace(question_text, '(C). व्याप्तवासिद्ध', '(C). सत्प्रतिपक्ष'),
    correct_option = 3
where english_question_ref_id = 2339
  and question_text like '%(C). व्याप्तवासिद्ध%';

commit;

-- VERIFY: expect both rows with correct_option = 3, English showing "C. Satpratipakṣa", Hindi showing "(C). सत्प्रतिपक्ष"
select 'en' as lang, correct_option, question_text from public.questions where id = 2339
union all
select 'hi', correct_option, question_text from public.questions_hindi where english_question_ref_id = 2339;
