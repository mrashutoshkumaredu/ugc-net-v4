-- Education 03 Jan 2026 Shift 2 (English and Hindi). Approved 20 Oct 2026.
-- From NTA's question paper (2026-01-03-Evening-QP.pdf):
-- 1. Q1-5: the DI table was squashed into one bracketed line on Q1, and Q2-5 said "[Same table as Q1]".
--    NTA's real table goes into layout_text for all five (English and Hindi headings from the paper).
--    Checked against the stored answers: Q1 1520, Q2 4500, Q3 C, Q4 E, Q5 A.
-- 2. Q46-50: English had only a bracketed summary on Q46, and Q47-50 said "[Same passage as Q46]".
--    NTA's full English passage (machine-read from the paper) goes into layout_text for all five.
--    Hindi: this paper has no Hindi passage. The fuller Hindi text already stored inside Q46 is moved, as it is, into layout_text for Q46-50.
-- 3. The bracketed notes are removed from the questions. Options and answers unchanged.
begin;

update public.questions set layout_text = $t$<p>Study carefully the table given below and answer the question asked here under.<br>The following table gives the percentage of students belonging to low income group in each of the five colleges A, B, C, D and E, along with the proportion of males and females with and without low income.</p><table border="1" width="100%" cellpadding="6"><tr><th rowspan="2">College Name</th><th rowspan="2">Percentage of students with low income</th><th colspan="2">Proportion of males and females</th></tr><tr><th>With low income<br>M : F</th><th>Without low income<br>M : F</th></tr><tr><td>A</td><td>35</td><td>5 : 6</td><td>6 : 7</td></tr><tr><td>B</td><td>25</td><td>3 : 5</td><td>4 : 5</td></tr><tr><td>C</td><td>24</td><td>1 : 2</td><td>2 : 3</td></tr><tr><td>D</td><td>19</td><td>3 : 2</td><td>4 : 3</td></tr><tr><td>E</td><td>15</td><td>5 : 3</td><td>3 : 2</td></tr></table>$t$
where paper_id = '09_EDUCATION_03_JAN_2026_SHIFT2' and question_number between 1 and 5 and coalesce(layout_text, '') = '';
update public.questions_hindi set layout_text = $t$<p>नीचे दी गई तालिका का ध्यानपूर्वक अध्ययन करें और उसके नीचे पूछे गए प्रश्न का उत्तर दें।<br>नीचे दी गई तालिका में पाँच कॉलेजों A, B, C, D और E में से प्रत्येक कॉलेज में निम्न आय वर्ग के छात्रों की संख्या का प्रतिशत तथा निम्न आय वर्ग और गैर-निम्न आय वर्ग के पुरुष छात्रों और महिला छात्रों का अनुपात दिया गया है।</p><table border="1" width="100%" cellpadding="6"><tr><th rowspan="2">कॉलेज का नाम</th><th rowspan="2">निम्न आय वर्ग के छात्रों का प्रतिशत</th><th colspan="2">पुरुष छात्रों और महिला छात्रों का अनुपात</th></tr><tr><th>निम्न आय वर्ग वाले<br>पुरुष : महिला</th><th>गैर-निम्न आय वाले<br>पुरुष : महिला</th></tr><tr><td>A</td><td>35</td><td>5 : 6</td><td>6 : 7</td></tr><tr><td>B</td><td>25</td><td>3 : 5</td><td>4 : 5</td></tr><tr><td>C</td><td>24</td><td>1 : 2</td><td>2 : 3</td></tr><tr><td>D</td><td>19</td><td>3 : 2</td><td>4 : 3</td></tr><tr><td>E</td><td>15</td><td>5 : 3</td><td>3 : 2</td></tr></table>$t$
where paper_id = '09_EDUCATION_03_JAN_2026_SHIFT2' and question_number between 1 and 5 and coalesce(layout_text, '') = '';

update public.questions set layout_text = $p$<p>Read the passage given below and answer questions:</p><p>If unpleasant things happen in our daily life, we immediately pay attention to them but do not notice other pleasant things. We experience these as normal or usual. This shows that compassion and affection are part of human nature.</p><p>Compassion or love has different levels; some are more mixed than others with desire or attachment. For example, parents’ attitudes toward their children contain a mixture of desire and attachment with compassion. The love and compassion between husband and wife-especially at the beginning of marriage when they don’t know the deep nature of each other-are on a superficial level. As soon as the attitude of one partner changes, the attitude of the other becomes opposite to what it was. That kind of love and compassion is more of the nature of attachment. Attachment means some kind of feeling of closeness projected by oneself. In reality, the other side may be very negative, but due to one’s own mental attachment and projection, it appears as something nice. Furthermore, attachment causes one to exaggerate a small good quality and make it appear 100 percent beautiful or 100 percent positive. As soon as the mental attitudes change, that picture completely changes. Therefore, that kind of love and compassion is, rather, attachment.</p>$p$
where paper_id = '09_EDUCATION_03_JAN_2026_SHIFT2' and question_number between 46 and 50 and coalesce(layout_text, '') = '';

-- Hindi passage: take the text stored inside Q46's brackets
update public.questions_hindi q set layout_text = '<p>' || s.passage || '</p>'
from (select substring(question_text from '^\[अवबोधन गद्यांश:\s*(.*)\]<br>') as passage
      from public.questions_hindi where paper_id = '09_EDUCATION_03_JAN_2026_SHIFT2' and question_number = 46) s
where q.paper_id = '09_EDUCATION_03_JAN_2026_SHIFT2' and q.question_number between 46 and 50 and coalesce(q.layout_text, '') = '' and s.passage is not null;

-- Remove the bracketed notes at the start of the questions
update public.questions set question_text = regexp_replace(question_text, '^\[(Table:|Same table as Q1|Comprehension passage:|Same passage as Q46)[^\]]*\]\s*(<br>)?', '')
where paper_id = '09_EDUCATION_03_JAN_2026_SHIFT2' and (question_number <= 5 or question_number >= 46) and question_text like '[%';
update public.questions_hindi set question_text = regexp_replace(question_text, '^\[(तालिका:|वही तालिका|अवबोधन गद्यांश:|प्रश्न 46 के समान)[^\]]*\]\s*(<br>)?', '')
where paper_id = '09_EDUCATION_03_JAN_2026_SHIFT2' and (question_number <= 5 or question_number >= 46) and question_text like '[%' and layout_text is not null;

commit;

-- VERIFY: expect 20 rows. Q1-5 has_table = true, Q46-50 has_passage = true, note_left = false everywhere.
select 'EN' as lang, question_number, layout_text like '%<table%' as has_table, length(layout_text) > 800 as has_passage,
       question_text like '[%' as note_left, left(question_text, 60) as question_start
from public.questions where paper_id = '09_EDUCATION_03_JAN_2026_SHIFT2' and (question_number <= 5 or question_number >= 46)
union all
select 'HI', question_number, layout_text like '%<table%', length(layout_text) > 800, question_text like '[%', left(question_text, 60)
from public.questions_hindi where paper_id = '09_EDUCATION_03_JAN_2026_SHIFT2' and (question_number <= 5 or question_number >= 46)
order by 2, 1;
