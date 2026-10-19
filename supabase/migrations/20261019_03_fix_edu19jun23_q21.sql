-- Education 19 Jun 2023 Shift 1, Q21 (id 1686): dropped by NTA, series had 4 blanks for 5 letters.
-- Author's decision (19 Oct): correct the series only. Stem and options unchanged. Answer: option 2 (c a c b a).

begin;

update public.questions
set question_text = 'Find the correct sequence of five (5) missing letters which will complete the following letter series:<br>d c _ b b a _ a d _ c _ b a _ a',
    correct_option = 1,
    ai_hint = 'Officially dropped by NTA. In the official paper the series read "d c c _ ba_ad_ccba_a". It asked for five missing letters but showed only four blanks, so no option fitted. We have corrected the series to "d c _ b b a _ a d _ c _ b a _ a". Filling the five blanks with c, a, c, b, a gives "dccbbaaa dccbbaaa", the block "dccbbaaa" written twice, so option (2) c a c b a is correct. Reference: UGC NET June 2023, Education (19 June 2023, Shift 1), Paper 1, Q21, dropped in the NTA final answer key.'
where id = 1686 and is_dropped and correct_option = -1;

commit;

-- VERIFY: expect correct_option = 1, is_dropped = true
select id, is_dropped, correct_option, question_text from public.questions where id = 1686;
