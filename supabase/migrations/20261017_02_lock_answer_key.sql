-- Step 2 of 2. Run only AFTER the new code (which uses the database
-- functions from step 1) is live. From here on, browsers can no longer read
-- the answer key or explanations, or save a score directly.

-- Questions: browsers may read everything except the answer key and the
-- explanation. (Column privileges: a select of correct_option / ai_hint is refused.)
revoke select, insert, update, delete, truncate, references, trigger on public.questions from anon, authenticated;
grant select (id, paper_id, cycle, unit, question_number, is_dropped, question_text, layout_text,
              option_a, option_b, option_c, option_d)
  on public.questions to anon, authenticated;

revoke select, insert, update, delete, truncate, references, trigger on public.questions_hindi from anon, authenticated;
grant select (id, paper_id, question_number, english_question_ref_id, unit, cycle, question_text, layout_text,
              option_a, option_b, option_c, option_d)
  on public.questions_hindi to anon, authenticated;

-- Scores: only submit_test() may write them now. Students can still read
-- their own history.
drop policy if exists "Users can insert own submissions" on public.test_submissions;
revoke insert, update, delete, truncate on public.test_submissions from anon, authenticated;
