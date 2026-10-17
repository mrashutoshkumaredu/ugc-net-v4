-- Unit VIII ICT topics (draft, for the author's approval).
-- Official bullet headings. Bullet 1 "ICT: General abbreviations and terminology" -> "ICT".
update public.questions set topic = case
  when id in (31,32,33,34,35,81,82,83,84,131,132,134,135,181,182,183,184,185,235,236,237,284,286,332,333,334,335,381,383,384,431,432,433,434,485,486,487,488,533,534,535,537,583,584,585,586,634,635,683,684,685,686,703,705,712,715,754,766,767,770,827,828,830,831,877,878,879,927,928,929,930,978,979,980,981,1027,1028,1029,1030,1031,1077,1078,1079,1080,1081,1126,1128,1175,1223,1224,1225,1226,1271,1273,1274,1322,1324,1325,1366,1367,1368,1369,1370,1454,1455,1456,1458,1505,1507,1508,1555,1556,1557,1605,1606,1609,1656,1659) then 'ICT'
  when id in (133,233,234,282,283,285,331,382,385,430,484,632,633,636,682,711,762,829,881,931,977,1125,1127,1129,1174,1176,1177,1178,1227,1272,1275,1321,1323,1457,1504,1554,1558,1607,1608,1657,1658) then 'Basics of Internet, Intranet, E-mail, Audio and Video-conferencing'
  when id in (85,536,710,738,768,1655) then 'Digital initiatives in higher education'
  when id in (880,1506) then 'ICT and Governance'
 end
 where unit = 'Information and Communication Technology (ICT)' and id in (31,32,33,34,35,81,82,83,84,131,132,134,135,181,182,183,184,185,235,236,237,284,286,332,333,334,335,381,383,384,431,432,433,434,485,486,487,488,533,534,535,537,583,584,585,586,634,635,683,684,685,686,703,705,712,715,754,766,767,770,827,828,830,831,877,878,879,927,928,929,930,978,979,980,981,1027,1028,1029,1030,1031,1077,1078,1079,1080,1081,1126,1128,1175,1223,1224,1225,1226,1271,1273,1274,1322,1324,1325,1366,1367,1368,1369,1370,1454,1455,1456,1458,1505,1507,1508,1555,1556,1557,1605,1606,1609,1656,1659,133,233,234,282,283,285,331,382,385,430,484,632,633,636,682,711,762,829,881,931,977,1125,1127,1129,1174,1176,1177,1178,1227,1272,1275,1321,1323,1457,1504,1554,1558,1607,1608,1657,1658,85,536,710,738,768,1655,880,1506);

-- 7 questions sit in the Teaching Aptitude slot of their papers (Q6-Q10) and test ICT tools for teaching.
-- They move to Teaching Aptitude.
update public.questions set unit = 'Teaching Aptitude', topic = 'Teaching Support System' where id = 906 and unit = 'Information and Communication Technology (ICT)';
update public.questions set unit = 'Teaching Aptitude', topic = 'Teaching Support System' where id = 955 and unit = 'Information and Communication Technology (ICT)';
update public.questions set unit = 'Teaching Aptitude', topic = 'Teaching Support System' where id = 1006 and unit = 'Information and Communication Technology (ICT)';
update public.questions set unit = 'Teaching Aptitude', topic = 'Teaching Support System' where id = 1052 and unit = 'Information and Communication Technology (ICT)';
update public.questions set unit = 'Teaching Aptitude', topic = 'Teaching Support System' where id = 1297 and unit = 'Information and Communication Technology (ICT)';
update public.questions set unit = 'Teaching Aptitude', topic = 'Teaching Support System' where id = 1343 and unit = 'Information and Communication Technology (ICT)';
update public.questions set unit = 'Teaching Aptitude', topic = 'Methods of teaching in Institutions of higher learning' where id = 1005 and unit = 'Information and Communication Technology (ICT)';

-- Check: ICT 118 / 41 / 6 / 2, and the 7 now in Teaching Aptitude.
select unit, topic, count(*) from public.questions
 where unit = 'Information and Communication Technology (ICT)' or id in (906,955,1006,1052,1297,1343,1005)
 group by unit, topic order by 1, 3 desc;
