-- Unit VII Data Interpretation topic (approved 18 Oct 2026).
-- Every question in this unit is a set of calculations on a given table or chart,
-- so all go under the official bullet "Data Interpretation".
-- No questions test the other bullets (sources and classification of data,
-- quantitative vs qualitative data, graphical representation, data and governance).
update public.questions
   set topic = 'Data Interpretation'
 where unit = 'Data Interpretation';

-- Check: one row, 161 questions.
select topic, count(*) from public.questions where unit = 'Data Interpretation' group by topic;
