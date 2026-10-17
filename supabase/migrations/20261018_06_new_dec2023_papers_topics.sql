-- Topics for the two new Dec 2023 papers (approved: tag only, no PDF check):
-- 09 Education 08 Dec 2023 Shift 1 (ids 1575-1624) and 39 French 07 Dec 2023 Shift 2 (ids 1625-1674).
-- Covers the six units already tagged (60 questions). The other four units are tagged with their unit.
update public.questions set topic = case
  when id in (1580,1630) then 'Teaching Support System'
  when id in (1581) then 'Evaluation Systems'
  when id in (1582) then 'Learner''s characteristics'
  when id in (1583,1631,1632,1633,1634) then 'Methods of teaching in Institutions of higher learning'
  when id in (1584) then 'Factors affecting teaching'
  when id in (1585) then 'Research'
  when id in (1586,1588,1636,1638) then 'Methods of Research'
  when id in (1587,1635,1637) then 'Steps of Research'
  when id in (1589,1639) then 'Research ethics'
  when id in (1590,1591,1592,1593,1642,1644) then 'Communication'
  when id in (1594,1640,1641,1643) then 'Effective communication'
  when id in (1595,1596,1646,1648,1649) then 'Number series, Letter series, Codes and Relationships'
  when id in (1597,1598,1599,1645,1647) then 'Mathematical Aptitude'
  when id in (1600,1602,1603,1650,1652,1653) then 'Understanding the structure of arguments'
  when id in (1601,1651) then 'Evaluating and distinguishing deductive and inductive reasoning'
  when id in (1604,1654) then 'Structure and kinds of Anumana, Vyapti, Hetvabhasas'
  when id in (1620,1621,1622,1623,1624,1670,1671,1672,1673,1674) then 'A passage of text be given. Questions be asked from the passage to be answered'
 end
 where id in (1580,1630,1581,1582,1583,1631,1632,1633,1634,1584,1585,1586,1588,1636,1638,1587,1635,1637,1589,1639,1590,1591,1592,1593,1642,1644,1594,1640,1641,1643,1595,1596,1646,1648,1649,1597,1598,1599,1645,1647,1600,1602,1603,1650,1652,1653,1601,1651,1604,1654,1620,1621,1622,1623,1624,1670,1671,1672,1673,1674) and topic is null;

-- Check: 60 rows tagged, none left empty in these six units.
select unit, count(*) as total, count(topic) as tagged from public.questions
 where id between 1575 and 1674
   and unit in ('Teaching Aptitude','Research Aptitude','Comprehension','Communication','Mathematical Reasoning and Aptitude','Logical Reasoning')
 group by unit order by 1;
