-- Teacher and student classes with tasks.
-- Teachers must be approved by an admin. Students join with a class code/link or accept an email invite.
-- All tables are closed to direct access (RLS on, no policies). Everything goes through the functions below.

begin;

create table if not exists public.teachers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  join_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create table if not exists public.class_invites (
  class_id uuid not null references public.classes(id) on delete cascade,
  email text not null,
  invited_at timestamptz not null default now(),
  primary key (class_id, email)
);

create table if not exists public.class_tasks (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  kind text not null check (kind in ('FULL', 'UNIT', 'SPEED')),
  paper_id text,
  unit text,
  topic text,
  question_count integer,
  drill text,
  target_stars integer,
  due_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.task_results (
  task_id uuid not null references public.class_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  submission_id integer,
  score_percentage numeric,
  correct integer,
  total integer,
  stars integer,
  points integer,
  completed_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

alter table public.teachers enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.class_invites enable row level security;
alter table public.class_tasks enable row level security;
alter table public.task_results enable row level security;

-- ---------- helpers ----------
create or replace function public._is_teacher() returns boolean
language sql stable security definer set search_path to '' as $$
  select exists (select 1 from public.teachers where user_id = auth.uid() and status = 'approved');
$$;

create or replace function public._owns_class(p_class uuid) returns boolean
language sql stable security definer set search_path to '' as $$
  select exists (select 1 from public.classes where id = p_class and teacher_id = auth.uid());
$$;

create or replace function public._user_label(p_uid uuid) returns jsonb
language sql stable security definer set search_path to '' as $$
  select jsonb_build_object('user_id', u.id, 'email', u.email,
           'name', coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)))
  from auth.users u where u.id = p_uid;
$$;

-- ---------- role ----------
create or replace function public.my_class_role() returns jsonb
language sql stable security definer set search_path to '' as $$
  select jsonb_build_object(
    'teacher_status', (select status from public.teachers where user_id = auth.uid()),
    'is_admin', public.is_admin());
$$;

create or replace function public.request_teacher() returns void
language plpgsql security definer set search_path to '' as $$
begin
  if auth.uid() is null then raise exception 'login_required'; end if;
  insert into public.teachers(user_id) values (auth.uid())
  on conflict (user_id) do update set status = case when public.teachers.status = 'rejected' then 'pending' else public.teachers.status end,
                                      requested_at = now();
end $$;

create or replace function public.admin_list_teachers() returns jsonb
language plpgsql stable security definer set search_path to '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return (select coalesce(jsonb_agg(public._user_label(t.user_id) || jsonb_build_object('status', t.status, 'requested_at', t.requested_at)
                 order by (t.status = 'pending') desc, t.requested_at desc), '[]'::jsonb) from public.teachers t);
end $$;

create or replace function public.admin_set_teacher(p_user uuid, p_approve boolean) returns void
language plpgsql security definer set search_path to '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  update public.teachers set status = case when p_approve then 'approved' else 'rejected' end, decided_at = now() where user_id = p_user;
end $$;

-- ---------- teacher ----------
create or replace function public.create_class(p_name text) returns uuid
language plpgsql security definer set search_path to '' as $$
declare v_id uuid; v_code text;
begin
  if not public._is_teacher() then raise exception 'not_teacher'; end if;
  loop
    v_code := upper(substr(translate(md5(random()::text || clock_timestamp()::text), '01', ''), 1, 6));
    exit when length(v_code) = 6 and not exists (select 1 from public.classes where join_code = v_code);
  end loop;
  insert into public.classes(teacher_id, name, join_code) values (auth.uid(), trim(p_name), v_code) returning id into v_id;
  return v_id;
end $$;

create or replace function public.delete_class(p_class uuid) returns void
language plpgsql security definer set search_path to '' as $$
begin
  if not public._owns_class(p_class) then raise exception 'not_found'; end if;
  delete from public.classes where id = p_class;
end $$;

create or replace function public.teacher_classes() returns jsonb
language sql stable security definer set search_path to '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'join_code', c.join_code, 'created_at', c.created_at,
      'students', (select count(*) from public.class_members m where m.class_id = c.id),
      'tasks', (select count(*) from public.class_tasks t where t.class_id = c.id))
    order by c.created_at desc), '[]'::jsonb)
  from public.classes c where c.teacher_id = auth.uid();
$$;

create or replace function public.class_detail(p_class uuid) returns jsonb
language plpgsql stable security definer set search_path to '' as $$
begin
  if not public._owns_class(p_class) then raise exception 'not_found'; end if;
  return jsonb_build_object(
    'class', (select jsonb_build_object('id', id, 'name', name, 'join_code', join_code) from public.classes where id = p_class),
    'students', (select coalesce(jsonb_agg(public._user_label(m.user_id) || jsonb_build_object('joined_at', m.joined_at) order by m.joined_at), '[]'::jsonb)
                 from public.class_members m where m.class_id = p_class),
    'invites', (select coalesce(jsonb_agg(i.email order by i.invited_at), '[]'::jsonb) from public.class_invites i where i.class_id = p_class),
    'tasks', (select coalesce(jsonb_agg(jsonb_build_object(
                 'id', t.id, 'title', t.title, 'kind', t.kind, 'paper_id', t.paper_id, 'unit', t.unit, 'topic', t.topic,
                 'question_count', t.question_count, 'drill', t.drill, 'target_stars', t.target_stars, 'due_on', t.due_on,
                 'results', (select coalesce(jsonb_agg(jsonb_build_object('user_id', r.user_id, 'score_percentage', r.score_percentage,
                                 'correct', r.correct, 'total', r.total, 'stars', r.stars, 'points', r.points, 'completed_at', r.completed_at)), '[]'::jsonb)
                             from public.task_results r where r.task_id = t.id)
               ) order by t.created_at desc), '[]'::jsonb)
              from public.class_tasks t where t.class_id = p_class));
end $$;

create or replace function public.invite_students(p_class uuid, p_emails text[]) returns integer
language plpgsql security definer set search_path to '' as $$
declare v_n integer;
begin
  if not public._owns_class(p_class) then raise exception 'not_found'; end if;
  insert into public.class_invites(class_id, email)
  select p_class, lower(trim(e)) from unnest(p_emails) e
  where trim(e) ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  on conflict do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

create or replace function public.remove_from_class(p_class uuid, p_user uuid, p_email text) returns void
language plpgsql security definer set search_path to '' as $$
begin
  if not public._owns_class(p_class) then raise exception 'not_found'; end if;
  if p_user is not null then delete from public.class_members where class_id = p_class and user_id = p_user; end if;
  if p_email is not null then delete from public.class_invites where class_id = p_class and email = lower(p_email); end if;
end $$;

create or replace function public.create_task(p_class uuid, p_title text, p_kind text, p_paper_id text, p_unit text,
  p_topic text, p_count integer, p_drill text, p_target_stars integer, p_due_on date) returns uuid
language plpgsql security definer set search_path to '' as $$
declare v_id uuid;
begin
  if not public._owns_class(p_class) then raise exception 'not_found'; end if;
  insert into public.class_tasks(class_id, title, kind, paper_id, unit, topic, question_count, drill, target_stars, due_on)
  values (p_class, coalesce(nullif(trim(p_title), ''), 'Task'), p_kind, p_paper_id, p_unit, nullif(p_topic, ''),
          greatest(1, least(coalesce(p_count, 10), 1000)), p_drill, greatest(1, least(coalesce(p_target_stars, 2), 3)), p_due_on)
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.delete_task(p_task uuid) returns void
language plpgsql security definer set search_path to '' as $$
begin
  delete from public.class_tasks t where t.id = p_task and public._owns_class(t.class_id);
end $$;

-- ---------- student ----------
create or replace function public.join_class(p_code text) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare v_class public.classes;
begin
  if auth.uid() is null then raise exception 'login_required'; end if;
  select * into v_class from public.classes where join_code = upper(trim(p_code));
  if not found then raise exception 'bad_code'; end if;
  insert into public.class_members(class_id, user_id) values (v_class.id, auth.uid()) on conflict do nothing;
  delete from public.class_invites where class_id = v_class.id and email = lower(auth.jwt() ->> 'email');
  return jsonb_build_object('id', v_class.id, 'name', v_class.name);
end $$;

create or replace function public.my_invites() returns jsonb
language sql stable security definer set search_path to '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('class_id', c.id, 'name', c.name, 'teacher', public._user_label(c.teacher_id) ->> 'name')), '[]'::jsonb)
  from public.class_invites i join public.classes c on c.id = i.class_id
  where i.email = lower(auth.jwt() ->> 'email')
    and not exists (select 1 from public.class_members m where m.class_id = c.id and m.user_id = auth.uid());
$$;

create or replace function public.answer_invite(p_class uuid, p_accept boolean) returns void
language plpgsql security definer set search_path to '' as $$
begin
  if not exists (select 1 from public.class_invites where class_id = p_class and email = lower(auth.jwt() ->> 'email')) then
    raise exception 'not_found';
  end if;
  if p_accept then
    insert into public.class_members(class_id, user_id) values (p_class, auth.uid()) on conflict do nothing;
  end if;
  delete from public.class_invites where class_id = p_class and email = lower(auth.jwt() ->> 'email');
end $$;

create or replace function public.leave_class(p_class uuid) returns void
language sql security definer set search_path to '' as $$
  delete from public.class_members where class_id = p_class and user_id = auth.uid();
$$;

create or replace function public.my_classes_and_tasks() returns jsonb
language sql stable security definer set search_path to '' as $$
  select jsonb_build_object(
    'classes', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'teacher', public._user_label(c.teacher_id) ->> 'name') order by c.name), '[]'::jsonb)
                from public.class_members m join public.classes c on c.id = m.class_id where m.user_id = auth.uid()),
    'tasks', (select coalesce(jsonb_agg(jsonb_build_object(
                'id', t.id, 'class_name', c.name, 'title', t.title, 'kind', t.kind, 'paper_id', t.paper_id, 'unit', t.unit,
                'topic', t.topic, 'question_count', t.question_count, 'drill', t.drill, 'target_stars', t.target_stars, 'due_on', t.due_on,
                'result', (select jsonb_build_object('score_percentage', r.score_percentage, 'correct', r.correct, 'total', r.total,
                                  'stars', r.stars, 'points', r.points, 'completed_at', r.completed_at)
                           from public.task_results r where r.task_id = t.id and r.user_id = auth.uid())
              ) order by t.due_on nulls last, t.created_at), '[]'::jsonb)
              from public.class_tasks t join public.classes c on c.id = t.class_id
              join public.class_members m on m.class_id = c.id and m.user_id = auth.uid()));
$$;

-- Test tasks: link a submitted test to the task (only the student's own submission).
create or replace function public.complete_test_task(p_task uuid, p_submission integer) returns void
language plpgsql security definer set search_path to '' as $$
declare v_sub public.test_submissions;
begin
  if not exists (select 1 from public.class_tasks t join public.class_members m on m.class_id = t.class_id
                 where t.id = p_task and m.user_id = auth.uid() and t.kind in ('FULL', 'UNIT')) then raise exception 'not_found'; end if;
  select * into v_sub from public.test_submissions where id = p_submission and user_id = auth.uid();
  if not found then raise exception 'not_found'; end if;
  insert into public.task_results(task_id, user_id, submission_id, score_percentage, correct, total)
  values (p_task, auth.uid(), v_sub.id, v_sub.score_percentage, v_sub.correct_answers, v_sub.total_questions)
  on conflict (task_id, user_id) do update set submission_id = excluded.submission_id, score_percentage = excluded.score_percentage,
    correct = excluded.correct, total = excluded.total, completed_at = now()
  where excluded.score_percentage >= coalesce(public.task_results.score_percentage, 0);
end $$;

-- Speed Math tasks: keep the best round.
create or replace function public.complete_speed_task(p_task uuid, p_stars integer, p_points integer) returns void
language plpgsql security definer set search_path to '' as $$
begin
  if not exists (select 1 from public.class_tasks t join public.class_members m on m.class_id = t.class_id
                 where t.id = p_task and m.user_id = auth.uid() and t.kind = 'SPEED') then raise exception 'not_found'; end if;
  insert into public.task_results(task_id, user_id, stars, points)
  values (p_task, auth.uid(), greatest(0, least(p_stars, 3)), greatest(0, p_points))
  on conflict (task_id, user_id) do update set stars = greatest(coalesce(public.task_results.stars, 0), excluded.stars),
    points = greatest(coalesce(public.task_results.points, 0), excluded.points), completed_at = now();
end $$;

-- Only logged-in users may call these.
do $$
declare f text;
begin
  foreach f in array array[
    '_is_teacher()', '_owns_class(uuid)', '_user_label(uuid)', 'my_class_role()', 'request_teacher()', 'admin_list_teachers()',
    'admin_set_teacher(uuid, boolean)', 'create_class(text)', 'delete_class(uuid)', 'teacher_classes()', 'class_detail(uuid)',
    'invite_students(uuid, text[])', 'remove_from_class(uuid, uuid, text)',
    'create_task(uuid, text, text, text, text, text, integer, text, integer, date)', 'delete_task(uuid)', 'join_class(text)',
    'my_invites()', 'answer_invite(uuid, boolean)', 'leave_class(uuid)', 'my_classes_and_tasks()',
    'complete_test_task(uuid, integer)', 'complete_speed_task(uuid, integer, integer)']
  loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

commit;

-- VERIFY: expect 6 tables with RLS on
select relname, relrowsecurity from pg_class
where relname in ('teachers', 'classes', 'class_members', 'class_invites', 'class_tasks', 'task_results') and relnamespace = 'public'::regnamespace
order by relname;
