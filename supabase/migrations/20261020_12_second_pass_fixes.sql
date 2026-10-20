-- Second-pass formatting fixes, found after files 01-11 were run. Approved 20 Oct 2026.
-- 1. Malayalam 11 Dec 2023 S2, statement questions Q6, 9, 19, 20, 32, 33, 41, 50 (EN + HI): line breaks before
--    Statement (I) / (II) (कथन (I) / (II)) and before the closing instruction. No words change.
-- 2. Number bases shown as subscripts, e.g. (499)10 -> (499)<sub>10</sub>, and (L)M -> (L)<sub>M</sub>:
--    Malayalam 11 Dec 2023 Q32, Psychology 14 Dec 2023 Q35, Political Science 06 Jan 2026 Q33 (EN + HI).
-- 3. Social Medicine 02 Jan 2026 Q27: the maths sign "not equal" had broken into a line break ("$SP<br>eq 0$").
--    Restored as $SP ≠ 0$ (two cells). The ≠ character is used because the table forbids the text "\n" (so \neq cannot be stored).
-- 4. Stray <br> between table rows/cells (in about 44 rows) removed. Browsers push them above the table as empty lines.
begin;

-- 1. Malayalam statements
update public.questions set question_text = regexp_replace(regexp_replace(regexp_replace(question_text,
    '\s*((Statement|कथन)\s*\(?I{1,2}\)?\s*:)', '<br>\1', 'gi'),
    '\s*(In (the )?light of the above|उपरोक्त कथन|उपर्युक्त कथन)', '<br>\1', 'i'), '^<br>', '')
where paper_id = '22_MALAYALAM_11_DEC_2023_SHIFT2' and question_number in (6, 9, 19, 20, 32, 33, 41, 50) and question_text !~ '<br';
update public.questions_hindi set question_text = regexp_replace(regexp_replace(regexp_replace(question_text,
    '\s*((Statement|कथन)\s*\(?I{1,2}\)?\s*:)', '<br>\1', 'gi'),
    '\s*(In (the )?light of the above|उपरोक्त कथन|उपर्युक्त कथन)', '<br>\1', 'i'), '^<br>', '')
where paper_id = '22_MALAYALAM_11_DEC_2023_SHIFT2' and question_number in (6, 9, 19, 20, 32, 33, 41, 50) and question_text !~ '<br';

-- 2. Number bases
update public.questions set question_text = regexp_replace(regexp_replace(question_text,
    '\(([0-9A-F.]+)\)(2|4|8|10|16)(?![0-9])', '(\1)<sub>\2</sub>', 'g'), '\(L\)M(?![A-Za-z])', '(L)<sub>M</sub>', 'g')
where id in (1890, 2043, 2492) and question_text !~ '<sub>';
update public.questions_hindi set question_text = regexp_replace(regexp_replace(question_text,
    '\(([0-9A-F.]+)\)(2|4|8|10|16)(?![0-9])', '(\1)<sub>\2</sub>', 'g'), '\(L\)M(?![A-Za-z])', '(L)<sub>M</sub>', 'g')
where id in (382, 535, 977) and question_text !~ '<sub>';

-- 3. Broken "not equal"
update public.questions set layout_text = replace(layout_text, '<br>eq 0$', ' ≠ 0$')
where paper_id = '81_SOCIAL_MEDICINE_AND_COMMUNITY_HEALTH_02_JAN_2026_SHIFT2' and question_number = 27 and layout_text like '%<br>eq 0$%';

-- 4. Stray <br> inside tables (only <br> sitting directly between table tags; <br> inside a cell's text is kept)
update public.questions set
  question_text = regexp_replace(question_text, '(<table[^>]*>|</tr>|</th>|</td>|<tr>)\s*(<br\s*/?>\s*)+(?=<tr|</table|<td|<th|</tr)', '\1', 'gi'),
  layout_text   = regexp_replace(layout_text,   '(<table[^>]*>|</tr>|</th>|</td>|<tr>)\s*(<br\s*/?>\s*)+(?=<tr|</table|<td|<th|</tr)', '\1', 'gi')
where coalesce(question_text, '') || coalesce(layout_text, '') ~* '(<table[^>]*>|</tr>|</th>|</td>|<tr>)\s*<br\s*/?>\s*(<br\s*/?>\s*)*(<tr|</table|<td|<th|</tr)';
update public.questions_hindi set
  question_text = regexp_replace(question_text, '(<table[^>]*>|</tr>|</th>|</td>|<tr>)\s*(<br\s*/?>\s*)+(?=<tr|</table|<td|<th|</tr)', '\1', 'gi'),
  layout_text   = regexp_replace(layout_text,   '(<table[^>]*>|</tr>|</th>|</td>|<tr>)\s*(<br\s*/?>\s*)+(?=<tr|</table|<td|<th|</tr)', '\1', 'gi')
where coalesce(question_text, '') || coalesce(layout_text, '') ~* '(<table[^>]*>|</tr>|</th>|</td>|<tr>)\s*<br\s*/?>\s*(<br\s*/?>\s*)*(<tr|</table|<td|<th|</tr)';

commit;

-- VERIFY: expect 0 rows
select 'EN' as lang, paper_id, question_number, 'br in table' as problem from public.questions
where coalesce(question_text, '') || coalesce(layout_text, '') ~* '(<table[^>]*>|</tr>|</th>|</td>|<tr>)\s*<br\s*/?>\s*(<tr|</table|<td|<th|</tr)'
union all select 'HI', paper_id, question_number, 'br in table' from public.questions_hindi
where coalesce(question_text, '') || coalesce(layout_text, '') ~* '(<table[^>]*>|</tr>|</th>|</td>|<tr>)\s*<br\s*/?>\s*(<tr|</table|<td|<th|</tr)'
union all select 'EN', paper_id, question_number, 'statement line' from public.questions
where paper_id = '22_MALAYALAM_11_DEC_2023_SHIFT2' and question_number in (6, 9, 19, 20, 32, 33, 41, 50) and question_text !~ '<br'
union all select 'HI', paper_id, question_number, 'statement line' from public.questions_hindi
where paper_id = '22_MALAYALAM_11_DEC_2023_SHIFT2' and question_number in (6, 9, 19, 20, 32, 33, 41, 50) and question_text !~ '<br'
union all select 'EN', paper_id, question_number, 'broken neq' from public.questions where layout_text like '%<br>eq %';
