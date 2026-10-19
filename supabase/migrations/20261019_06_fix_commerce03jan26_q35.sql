-- Commerce 3 Jan 2026 Shift 1, Q35 (id 2594): dropped by NTA. No option gave the correct order A, D, B, C.
-- Author's decision (19 Oct): correct option 3 from "A, D, C, B" to "A, D, B, C", in English and Hindi. Answer: option 3.

begin;

update public.questions
set option_c = 'A, D, B, C',
    correct_option = 2,
    ai_hint = 'Officially dropped by NTA. In the official paper option (3) read "A, D, C, B", and none of the four options gave the correct order. By the area they cover, a Personal Area Network (PAN) links devices around one person (a few metres), a Local Area Network (LAN) covers a room, building or campus, a Metropolitan Area Network (MAN) covers a city, and a Wide Area Network (WAN) covers a country or the world. So the increasing order is PAN, LAN, MAN, WAN, that is A, D, B, C. We have corrected option (3), the closest option, to "A, D, B, C", so option (3) is correct. Reference: A. S. Tanenbaum and D. J. Wetherall, Computer Networks, chapter 1 (classification of networks by scale). Original question: UGC NET December 2025, Commerce (3 January 2026, Shift 1), Paper 1, Q35, dropped in the NTA final answer key.'
where id = 2594 and is_dropped and correct_option = -1 and option_c = 'A, D, C, B';

update public.questions_hindi
set option_c = 'A, D, B, C',
    correct_option = 2
where english_question_ref_id = 2594 and option_c = 'A, D, C, B';

commit;

-- VERIFY: expect both rows with option_c = 'A, D, B, C' and correct_option = 2. Then no_answer should be 0.
select 'en' as lang, option_c, correct_option from public.questions where id = 2594
union all
select 'hi', option_c, correct_option from public.questions_hindi where english_question_ref_id = 2594;
select count(*) as dropped_with_no_answer from public.questions where is_dropped and coalesce(correct_option, -1) not between 0 and 3;
