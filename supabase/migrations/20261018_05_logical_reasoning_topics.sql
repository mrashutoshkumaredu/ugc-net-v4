-- Unit VI Logical Reasoning topics (approved 18 Oct 2026).
-- Official bullet headings. Bullet 7 is written without its English glosses, as approved.
update public.questions set topic = case
  when id in (26,27,29,30,76,78,79,80,127,130,228,229,230,231,277,278,279,280,326,327,328,329,376,377,378,379,425,426,427,428,475,477,527,576,623,624,673,676,707,727,734,736,763,777,790,823,824,874,924,972,973,974,975,1022,1023,1024,1025,1072,1073,1074,1075,1120,1121,1122,1123,1169,1170,1171,1172,1218,1220,1221,1266,1267,1268,1316,1317,1318,1362,1363,1364,1449,1450,1451,1452,1499,1500,1501,1502,1549,1550,1551,1552) then 'Understanding the structure of arguments'
  when id in (128,129,178,476,574,625,675,733,755,822,825,872,923,925,1219,1269,1319) then 'Evaluating and distinguishing deductive and inductive reasoning'
  when id in (525,526,575,622) then 'Analogies'
  when id in (672) then 'Venn diagram'
  when id in (573,674,735,757,875,922,1173) then 'Indian Logic'
  when id in (177,179,180,232,330,380,524,926,1365) then 'Pramanas'
  when id in (28,77,126,176,281,429,474,478,523,626,753,826,873,876,976,1026,1076,1124,1222,1270,1320,1361,1453,1503,1553) then 'Structure and kinds of Anumana, Vyapti, Hetvabhasas'
 end
 where unit = 'Logical Reasoning' and id in (26,27,29,30,76,78,79,80,127,130,228,229,230,231,277,278,279,280,326,327,328,329,376,377,378,379,425,426,427,428,475,477,527,576,623,624,673,676,707,727,734,736,763,777,790,823,824,874,924,972,973,974,975,1022,1023,1024,1025,1072,1073,1074,1075,1120,1121,1122,1123,1169,1170,1171,1172,1218,1220,1221,1266,1267,1268,1316,1317,1318,1362,1363,1364,1449,1450,1451,1452,1499,1500,1501,1502,1549,1550,1551,1552,128,129,178,476,574,625,675,733,755,822,825,872,923,925,1219,1269,1319,525,526,575,622,672,573,674,735,757,875,922,1173,177,179,180,232,330,380,524,926,1365,28,77,126,176,281,429,474,478,523,626,753,826,873,876,976,1026,1076,1124,1222,1270,1320,1361,1453,1503,1553);

-- 22 coding / series / direction / blood-relation questions move to Unit V, as approved.
update public.questions
   set unit = 'Mathematical Reasoning and Aptitude',
       topic = 'Number series, Letter series, Codes and Relationships'
 where id in (706,783,920,968,969,1017,1019,1068,1070,1071,1117,1118,1119,1166,1167,1168,1214,1261,1262,1311,1312,1358) and unit = 'Logical Reasoning';

-- Two typos fixed, as approved.
update public.questions set question_text = replace(question_text, 'All saints and materialists', 'All saints are materialists')
 where id = 1022 and question_text like '%All saints and materialists%';
update public.questions set question_text = replace(question_text, 'argument in four of vegetarianism', 'argument in favour of vegetarianism')
 where id = 1075 and question_text like '%argument in four of vegetarianism%';

-- Check: 93 / 17 / 4 / 1 / 7 / 9 / 25 in Logical Reasoning, and the 22 now in Unit V.
select unit, topic, count(*) from public.questions
 where unit = 'Logical Reasoning' or id in (706,783,920,968,969,1017,1019,1068,1070,1071,1117,1118,1119,1166,1167,1168,1214,1261,1262,1311,1312,1358)
 group by unit, topic order by 1, 3 desc;
