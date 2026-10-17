-- Unit V Mathematical Reasoning and Aptitude topics (approved 18 Oct 2026).
-- Official bullet names. Bullet 3 is cut where its bracketed list of examples starts.
update public.questions set topic = case
  when id in (21,24,71,72,122,125,172,175,223,224,272,273,321,322,371,372,420,421,519,568,569,617,817,818,867,870,917,970,1020,1069,1445,1496,1544,1545) then 'Number series, Letter series, Codes and Relationships'
  when id in (22,23,25,73,74,75,121,123,124,171,173,174,225,226,227,274,275,276,323,324,325,373,374,375,422,423,424,470,471,472,473,520,521,522,570,571,572,618,619,620,621,667,668,669,670,671,709,714,717,739,752,756,774,791,819,820,821,868,869,871,918,919,921,967,971,1018,1021,1067,1116,1164,1165,1215,1216,1217,1263,1264,1265,1313,1314,1315,1356,1357,1359,1360,1444,1446,1447,1448,1494,1495,1497,1498,1546,1547,1548) then 'Mathematical Aptitude'
 end
 where unit = 'Mathematical Reasoning and Aptitude' and id in (21,24,71,72,122,125,172,175,223,224,272,273,321,322,371,372,420,421,519,568,569,617,817,818,867,870,917,970,1020,1069,1445,1496,1544,1545,22,23,25,73,74,75,121,123,124,171,173,174,225,226,227,274,275,276,323,324,325,373,374,375,422,423,424,470,471,472,473,520,521,522,570,571,572,618,619,620,621,667,668,669,670,671,709,714,717,739,752,756,774,791,819,820,821,868,869,871,918,919,921,967,971,1018,1021,1067,1116,1164,1165,1215,1216,1217,1263,1264,1265,1313,1314,1315,1356,1357,1359,1360,1444,1446,1447,1448,1494,1495,1497,1498,1546,1547,1548);

-- 703 (base-4 to base-10) and 754 (numbers in different bases) move to ICT, as approved.
-- Their ICT topic is set when Unit VIII is tagged.
update public.questions set unit = 'Information and Communication Technology (ICT)', topic = null
 where id in (703, 754) and unit = 'Mathematical Reasoning and Aptitude';

-- Check: Mathematical Aptitude 95, Number series... 34, and 703/754 now in ICT.
select unit, topic, count(*) from public.questions
 where unit = 'Mathematical Reasoning and Aptitude' or id in (703, 754)
 group by unit, topic order by 1, 3 desc;
