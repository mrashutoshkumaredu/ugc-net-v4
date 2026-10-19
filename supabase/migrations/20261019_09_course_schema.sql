-- Maths course (from the book "UGC NET Paper 1 Maths"): chapters, practice sets, questions, attempts.
-- Practice is free for everyone. The full lesson text is only for teachers, admins, and students
-- whose teacher has assigned that chapter's lesson. Run after 20261019_08_classes_and_tasks.sql.

begin;

create table if not exists public.course_chapters (
  no integer primary key,
  part text not null,
  title text not null,
  subtitle text,
  classes integer[] not null default '{}',
  lesson_html text
);

create table if not exists public.course_sets (
  id text primary key,
  title text not null,
  kind text not null check (kind in ('dpp', 'test', 'diagnostic', 'mock')),
  chapter_no integer references public.course_chapters(no),
  class_no integer,
  minutes integer not null default 15,
  sort integer not null default 0
);

create table if not exists public.course_questions (
  id serial primary key,
  set_id text not null references public.course_sets(id) on delete cascade,
  position integer not null,
  level text,
  source text,
  question_html text not null,
  layout_html text,
  option_a text not null, option_b text not null, option_c text not null, option_d text not null,
  correct_option integer not null check (correct_option between 0 and 3),
  explanation_html text,
  unique (set_id, position)
);

create table if not exists public.course_attempts (
  id serial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id text not null references public.course_sets(id) on delete cascade,
  task_id uuid references public.class_tasks(id) on delete set null,
  correct integer not null,
  total integer not null,
  score_percentage numeric not null,
  time_seconds integer,
  submitted_at timestamptz not null default now()
);

create table if not exists public.course_attempt_answers (
  attempt_id integer not null references public.course_attempts(id) on delete cascade,
  question_id integer not null references public.course_questions(id) on delete cascade,
  chosen integer,
  is_correct boolean not null,
  primary key (attempt_id, question_id)
);

alter table public.course_chapters enable row level security;
alter table public.course_sets enable row level security;
alter table public.course_questions enable row level security;
alter table public.course_attempts enable row level security;
alter table public.course_attempt_answers enable row level security;

-- Can the current user read this chapter's full lesson?
create or replace function public._can_read_lesson(p_chapter integer) returns boolean
language sql stable security definer set search_path to '' as $$
  select coalesce(public.is_admin(), false) or public._is_teacher() or exists (
    select 1 from public.class_tasks t join public.class_members m on m.class_id = t.class_id
    where m.user_id = auth.uid() and t.kind = 'LESSON' and t.chapter_no = p_chapter);
$$;

-- Course home: chapters (no lesson text), sets, and the user's best score per set.
create or replace function public.course_catalog() returns jsonb
language sql stable security definer set search_path to '' as $$
  select jsonb_build_object(
    'chapters', (select coalesce(jsonb_agg(jsonb_build_object('no', c.no, 'part', c.part, 'title', c.title, 'subtitle', c.subtitle,
                   'classes', c.classes, 'can_read', public._can_read_lesson(c.no)) order by c.no), '[]'::jsonb) from public.course_chapters c),
    'sets', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'title', s.title, 'kind', s.kind, 'chapter_no', s.chapter_no,
               'class_no', s.class_no, 'minutes', s.minutes, 'questions', (select count(*) from public.course_questions q where q.set_id = s.id),
               'best', (select max(a.score_percentage) from public.course_attempts a where a.set_id = s.id and a.user_id = auth.uid()))
             order by s.sort), '[]'::jsonb) from public.course_sets s));
$$;

-- Full lesson text, only when allowed.
create or replace function public.course_lesson(p_chapter integer) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
begin
  if not public._can_read_lesson(p_chapter) then
    return jsonb_build_object('locked', true);
  end if;
  return (select jsonb_build_object('locked', false, 'html', lesson_html) from public.course_chapters where no = p_chapter);
end $$;

-- Questions of a set, without answers.
create or replace function public.course_set_questions(p_set text) returns jsonb
language sql stable security definer set search_path to '' as $$
  select jsonb_build_object(
    'set', (select jsonb_build_object('id', id, 'title', title, 'kind', kind, 'chapter_no', chapter_no, 'minutes', minutes) from public.course_sets where id = p_set),
    'questions', (select coalesce(jsonb_agg(jsonb_build_object('id', q.id, 'position', q.position, 'level', q.level, 'source', q.source,
                    'question_html', q.question_html, 'layout_html', q.layout_html,
                    'options', jsonb_build_array(q.option_a, q.option_b, q.option_c, q.option_d)) order by q.position), '[]'::jsonb)
                  from public.course_questions q where q.set_id = p_set));
$$;

-- Score a set. Anyone can check answers; logged-in users' attempts are saved, and a class task is recorded.
create or replace function public.course_submit_set(p_set text, p_answers jsonb, p_seconds integer default null, p_task uuid default null)
returns jsonb
language plpgsql security definer set search_path to '' as $$
declare
  v_ans jsonb := coalesce(p_answers, '{}'::jsonb);
  v_total integer; v_correct integer; v_pct numeric; v_attempt integer; v_key jsonb;
begin
  select count(*),
         count(*) filter (where (v_ans ->> q.id::text) ~ '^[0-3]$' and (v_ans ->> q.id::text)::int = q.correct_option),
         jsonb_object_agg(q.id::text, jsonb_build_object('correct', q.correct_option, 'explanation', q.explanation_html))
    into v_total, v_correct, v_key
  from public.course_questions q where q.set_id = p_set;
  if v_total = 0 then raise exception 'no_questions'; end if;
  v_pct := round(v_correct * 100.0 / v_total, 2);

  if auth.uid() is not null then
    insert into public.course_attempts(user_id, set_id, task_id, correct, total, score_percentage, time_seconds)
    values (auth.uid(), p_set, p_task, v_correct, v_total, v_pct, p_seconds) returning id into v_attempt;
    insert into public.course_attempt_answers(attempt_id, question_id, chosen, is_correct)
    select v_attempt, q.id,
           case when (v_ans ->> q.id::text) ~ '^[0-3]$' then (v_ans ->> q.id::text)::int end,
           coalesce((v_ans ->> q.id::text) ~ '^[0-3]$' and (v_ans ->> q.id::text)::int = q.correct_option, false)
    from public.course_questions q where q.set_id = p_set;

    if p_task is not null and exists (select 1 from public.class_tasks t join public.class_members m on m.class_id = t.class_id
                                      where t.id = p_task and m.user_id = auth.uid() and t.kind = 'CHAPTER' and t.set_id = p_set) then
      insert into public.task_results(task_id, user_id, submission_id, score_percentage, correct, total)
      values (p_task, auth.uid(), v_attempt, v_pct, v_correct, v_total)
      on conflict (task_id, user_id) do update set submission_id = excluded.submission_id, score_percentage = excluded.score_percentage,
        correct = excluded.correct, total = excluded.total, completed_at = now()
      where excluded.score_percentage >= coalesce(public.task_results.score_percentage, 0);
    end if;
  end if;

  return jsonb_build_object('correct', v_correct, 'total', v_total, 'score_percentage', v_pct, 'key', v_key, 'saved', v_attempt is not null);
end $$;

-- Student marks an assigned lesson as read.
create or replace function public.course_lesson_done(p_task uuid) returns void
language plpgsql security definer set search_path to '' as $$
begin
  if not exists (select 1 from public.class_tasks t join public.class_members m on m.class_id = t.class_id
                 where t.id = p_task and m.user_id = auth.uid() and t.kind = 'LESSON') then raise exception 'not_found'; end if;
  insert into public.task_results(task_id, user_id) values (p_task, auth.uid()) on conflict (task_id, user_id) do nothing;
end $$;

-- Teacher: for a chapter-practice task, how many students got each question wrong.
create or replace function public.course_task_question_stats(p_task uuid) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
declare v_t public.class_tasks;
begin
  select * into v_t from public.class_tasks where id = p_task;
  if not found or not public._owns_class(v_t.class_id) then raise exception 'not_found'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('position', q.position, 'question_html', q.question_html,
            'answered', x.answered, 'wrong', x.wrong) order by q.position), '[]'::jsonb)
          from public.course_questions q
          left join lateral (
            select count(*) as answered, count(*) filter (where not aa.is_correct) as wrong
            from public.task_results r
            join public.course_attempt_answers aa on aa.attempt_id = r.submission_id and aa.question_id = q.id
            where r.task_id = p_task
          ) x on true
          where q.set_id = v_t.set_id);
end $$;

-- Who may call what.
revoke all on function public._can_read_lesson(integer) from public, anon;
grant execute on function public._can_read_lesson(integer) to authenticated;
grant execute on function public.course_catalog() to anon, authenticated;
grant execute on function public.course_set_questions(text) to anon, authenticated;
grant execute on function public.course_submit_set(text, jsonb, integer, uuid) to anon, authenticated;
revoke all on function public.course_lesson(integer) from public, anon;
grant execute on function public.course_lesson(integer) to authenticated;
revoke all on function public.course_lesson_done(uuid) from public, anon;
grant execute on function public.course_lesson_done(uuid) to authenticated;
revoke all on function public.course_task_question_stats(uuid) from public, anon;
grant execute on function public.course_task_question_stats(uuid) to authenticated;

commit;

-- VERIFY: expect 5 tables with RLS on
select relname, relrowsecurity from pg_class
where relname in ('course_chapters', 'course_sets', 'course_questions', 'course_attempts', 'course_attempt_answers')
  and relnamespace = 'public'::regnamespace order by relname;
