-- Line breaks: Political Science 11 Dec 2023 Shift 1 (24 questions) and Malayalam 11 Dec 2023 Shift 2 (9 questions), English and Hindi.
-- Adds <br> before each lettered item (A. / (A). / (A) / a)), before Statement I / II (कथन - I / II),
-- and before the closing line ("Choose the correct answer…", "In light of the above…", "नीचे दिए गए…", "उपर्युक्त कथनों…").
-- No words change. Approved 20 Oct 2026. Only rows with no <br> yet are touched, so running it twice is safe.
begin;

update public.questions set question_text = regexp_replace(regexp_replace(regexp_replace(regexp_replace(question_text,
    '\s+(\([A-E]\)\.?|[A-E]\.|[a-e]\))\s', '<br>\1 ', 'g'),
    '\s*((statement\s*\(?I{1,2}\)?|कथन\s*-\s*I{1,2})\s*:)', '<br>\1', 'gi'),
    '\s*(In (the )?light of the above|Choose the (correct|most)|उपर्युक्त कथनों के आलोक में|नीचे दिए गए विकल्पों में से)', '<br>\1', 'i'),
    '^<br>', '')
where question_text !~ '<br|<table'
  and ((paper_id = '02_POLITICAL_SCIENCE_11_DEC_2023_SHIFT1' and question_number in (7,8,10,11,12,18,19,20,25,26,27,30,33,34,35,38,39,40,43,44,47,48,49,50))
    or (paper_id = '22_MALAYALAM_11_DEC_2023_SHIFT2' and question_number in (14,18,26,27,30,34,39,47,48)));

update public.questions_hindi set question_text = regexp_replace(regexp_replace(regexp_replace(regexp_replace(question_text,
    '\s+(\([A-E]\)\.?|[A-E]\.|[a-e]\))\s', '<br>\1 ', 'g'),
    '\s*((statement\s*\(?I{1,2}\)?|कथन\s*-\s*I{1,2})\s*:)', '<br>\1', 'gi'),
    '\s*(In (the )?light of the above|Choose the (correct|most)|उपर्युक्त कथनों के आलोक में|नीचे दिए गए विकल्पों में से)', '<br>\1', 'i'),
    '^<br>', '')
where question_text !~ '<br|<table'
  and ((paper_id = '02_POLITICAL_SCIENCE_11_DEC_2023_SHIFT1' and question_number in (7,8,10,11,12,18,19,20,25,26,27,30,33,34,35,38,39,40,43,44,47,48,49,50))
    or (paper_id = '22_MALAYALAM_11_DEC_2023_SHIFT2' and question_number in (14,18,26,27,30,34,39,47,48)));

-- Q25 (coding question): put the final question on its own line too
update public.questions set question_text = replace(question_text, ' is coded as 47 How ', ' is coded as 47<br>How ')
where paper_id = '02_POLITICAL_SCIENCE_11_DEC_2023_SHIFT1' and question_number = 25;
update public.questions_hindi set question_text = replace(question_text, ' के रूप में कूटित है उस भाषा में ', ' के रूप में कूटित है<br>उस भाषा में ')
where paper_id = '02_POLITICAL_SCIENCE_11_DEC_2023_SHIFT1' and question_number = 25;

commit;

-- VERIFY: expect 0 rows (every listed question now has line breaks)
select 'EN' as lang, paper_id, question_number from public.questions
where question_text !~ '<br' and ((paper_id = '02_POLITICAL_SCIENCE_11_DEC_2023_SHIFT1' and question_number in (7,8,10,11,12,18,19,20,25,26,27,30,33,34,35,38,39,40,43,44,47,48,49,50))
   or (paper_id = '22_MALAYALAM_11_DEC_2023_SHIFT2' and question_number in (14,18,26,27,30,34,39,47,48)))
union all
select 'HI', paper_id, question_number from public.questions_hindi
where question_text !~ '<br' and ((paper_id = '02_POLITICAL_SCIENCE_11_DEC_2023_SHIFT1' and question_number in (7,8,10,11,12,18,19,20,25,26,27,30,33,34,35,38,39,40,43,44,47,48,49,50))
   or (paper_id = '22_MALAYALAM_11_DEC_2023_SHIFT2' and question_number in (14,18,26,27,30,34,39,47,48)));
