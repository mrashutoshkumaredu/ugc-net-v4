-- Unit III Comprehension: one official topic for all passage questions (approved 18 Oct 2026).
-- Topic name = the whole syllabus bullet, word for word, without the final full stop.
update public.questions
   set topic = 'A passage of text be given. Questions be asked from the passage to be answered'
 where unit = 'Comprehension';

-- Check: should show one row, about 154 questions.
select topic, count(*) from public.questions where unit = 'Comprehension' group by topic;
