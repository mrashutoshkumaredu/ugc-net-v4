-- Bodo 08 Dec 2023 Shift 2. Approved 20 Oct 2026.
-- 1. Hindi: Roman numerals typed as danda (। for I, ॥ for II) after कथन / तालिका / सूची, and ॥ anywhere, are written I / II.
-- 2. Option B was a copy of option A ("both true" twice) in Hindi Q8, 19, 26, 28, 30, 32, 33, 39, 45, 50 and English Q19, 45.
--    It is set to "both false". No answer key changes (none of these questions has B as its answer).
begin;

-- 1. Numerals (all Bodo Hindi rows, every text column)
update public.questions_hindi set
  question_text = regexp_replace(regexp_replace(regexp_replace(regexp_replace(question_text, '-॥', '-II', 'g'), '॥', ' II', 'g'), '(कथन|तालिका|सूची)-।', '\1-I', 'g'), '(कथन|तालिका|सूची)।', '\1 I', 'g'),
  layout_text   = regexp_replace(regexp_replace(regexp_replace(regexp_replace(layout_text,   '-॥', '-II', 'g'), '॥', ' II', 'g'), '(कथन|तालिका|सूची)-।', '\1-I', 'g'), '(कथन|तालिका|सूची)।', '\1 I', 'g'),
  option_a      = regexp_replace(regexp_replace(regexp_replace(regexp_replace(option_a,      '-॥', '-II', 'g'), '॥', ' II', 'g'), '(कथन|तालिका|सूची)-।', '\1-I', 'g'), '(कथन|तालिका|सूची)।', '\1 I', 'g'),
  option_b      = regexp_replace(regexp_replace(regexp_replace(regexp_replace(option_b,      '-॥', '-II', 'g'), '॥', ' II', 'g'), '(कथन|तालिका|सूची)-।', '\1-I', 'g'), '(कथन|तालिका|सूची)।', '\1 I', 'g'),
  option_c      = regexp_replace(regexp_replace(regexp_replace(regexp_replace(option_c,      '-॥', '-II', 'g'), '॥', ' II', 'g'), '(कथन|तालिका|सूची)-।', '\1-I', 'g'), '(कथन|तालिका|सूची)।', '\1 I', 'g'),
  option_d      = regexp_replace(regexp_replace(regexp_replace(regexp_replace(option_d,      '-॥', '-II', 'g'), '॥', ' II', 'g'), '(कथन|तालिका|सूची)-।', '\1-I', 'g'), '(कथन|तालिका|सूची)।', '\1 I', 'g')
where paper_id = '94_BODO_08_DEC_2023_SHIFT2'
  and (coalesce(question_text,'') || coalesce(layout_text,'') || concat_ws(' ', option_a, option_b, option_c, option_d)) ~ '॥|(कथन|तालिका|सूची)-?।';

-- 2. Duplicate option B (only where B is still the same as A)
update public.questions_hindi set option_b = 'कथन I और II दोनों गलत हैं।'
where paper_id = '94_BODO_08_DEC_2023_SHIFT2' and question_number = 8 and option_b = option_a;

update public.questions_hindi set option_b = 'कथन I और II दोनों असत्य हैं।'
where paper_id = '94_BODO_08_DEC_2023_SHIFT2' and question_number in (19, 26, 28, 30, 32, 33, 39, 45, 50) and option_b = option_a;

update public.questions set option_b = 'Both statement I and Statement II are incorrect'
where paper_id = '94_BODO_08_DEC_2023_SHIFT2' and question_number = 19 and option_b = option_a;

update public.questions set option_b = 'Both Statement (I) and Statement (II) are false.'
where paper_id = '94_BODO_08_DEC_2023_SHIFT2' and question_number = 45 and option_b = option_a;

commit;

-- VERIFY 1: expect 0 rows (no danda numerals and no duplicate A/B left in Bodo)
select 'HI' as lang, question_number, 'numeral left' as problem from public.questions_hindi
where paper_id = '94_BODO_08_DEC_2023_SHIFT2' and (coalesce(question_text,'') || coalesce(layout_text,'') || concat_ws(' ', option_a, option_b, option_c, option_d)) ~ '॥|(कथन|तालिका|सूची)-?।'
union all
select 'HI', question_number, 'A = B' from public.questions_hindi where paper_id = '94_BODO_08_DEC_2023_SHIFT2' and option_a = option_b
union all
select 'EN', question_number, 'A = B' from public.questions where paper_id = '94_BODO_08_DEC_2023_SHIFT2' and option_a = option_b;

-- VERIFY 2: a look at Q19 in both languages
select 'EN' as lang, option_a, option_b, option_c, option_d, correct_option from public.questions where paper_id = '94_BODO_08_DEC_2023_SHIFT2' and question_number = 19
union all
select 'HI', option_a, option_b, option_c, option_d, correct_option from public.questions_hindi where paper_id = '94_BODO_08_DEC_2023_SHIFT2' and question_number = 19;
