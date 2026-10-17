-- Step 1 of 2. Adds tables and functions only; nothing is removed or locked,
-- so the old site keeps working while the new code is deployed.
-- Step 2 (20261017_02_lock_answer_key.sql) runs after the new code is live.

-- 1. Admins ------------------------------------------------------------------
create table if not exists public.app_admins (email text primary key);
alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;
insert into public.app_admins(email) values ('ashuofficial03@gmail.com') on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.app_admins a where a.email = (auth.jwt() ->> 'email'));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 2. Question columns and label fixes ----------------------------------------
alter table public.questions add column if not exists question_number integer;
alter table public.questions add column if not exists is_dropped boolean not null default false;

update public.questions set unit = 'Information and Communication Technology (ICT)' where unit = 'ICT';
update public.questions set unit = 'Comprehension' where unit = 'Reading Comprehension';
update public.questions set cycle = 'December_2025' where cycle = 'December_2026';
update public.questions set cycle = 'June_2024_Cancelled' where cycle = 'June_2024';

-- Number questions 1–50 in papers that are complete. Papers with a question
-- dropped by NTA are numbered when the dropped question is added back.
with numbered as (
  select id, row_number() over (partition by paper_id order by id) as n,
         count(*) over (partition by paper_id) as c
  from public.questions
)
update public.questions q set question_number = numbered.n
from numbered
where q.id = numbered.id and numbered.c = 50 and q.question_number is null;

create index if not exists questions_paper_idx on public.questions(paper_id);
create index if not exists questions_unit_idx on public.questions(unit);
create index if not exists questions_hindi_ref_idx on public.questions_hindi(english_question_ref_id);

-- 3. Test sessions -------------------------------------------------------------
create table if not exists public.test_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('FULL', 'UNIT')),
  paper_id text,
  unit text,
  question_ids integer[] not null,
  duration_seconds integer not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  submission_id integer references public.test_submissions(id) on delete set null
);
create index if not exists test_sessions_user_idx on public.test_sessions(user_id);
alter table public.test_sessions enable row level security;
revoke all on public.test_sessions from anon, authenticated;
grant select on public.test_sessions to authenticated;
drop policy if exists "Users read own sessions" on public.test_sessions;
create policy "Users read own sessions" on public.test_sessions
  for select to authenticated using ((select auth.uid()) = user_id);

-- Questions of a session in order, WITHOUT the answer key or explanation.
create or replace function public._session_questions(p_ids integer[]) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', q.id, 'paper_id', q.paper_id, 'cycle', q.cycle, 'unit', q.unit,
      'question_number', q.question_number, 'is_dropped', q.is_dropped,
      'question_text', q.question_text, 'layout_text', q.layout_text,
      'option_a', q.option_a, 'option_b', q.option_b, 'option_c', q.option_c, 'option_d', q.option_d,
      'question_text_hi', h.question_text, 'layout_text_hi', h.layout_text,
      'option_a_hi', h.option_a, 'option_b_hi', h.option_b, 'option_c_hi', h.option_c, 'option_d_hi', h.option_d
    ) order by x.ord), '[]'::jsonb)
  from unnest(p_ids) with ordinality as x(id, ord)
  join public.questions q on q.id = x.id
  left join public.questions_hindi h on h.english_question_ref_id = q.id;
$$;
revoke all on function public._session_questions(integer[]) from public, anon, authenticated;

-- 4. Home page catalogue (counts only, no answers) -----------------------------
create or replace function public.get_catalog() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'total', (select count(*) from public.questions),
    'papers', (select coalesce(jsonb_agg(p order by p.cycle, p.paper_id), '[]'::jsonb) from (
        select paper_id, cycle, count(*) as question_count
        from public.questions group by paper_id, cycle) p),
    'units', (select coalesce(jsonb_agg(u), '[]'::jsonb) from (
        select unit, count(*) as question_count from public.questions
        where unit is not null and not is_dropped group by unit) u)
  );
$$;
revoke all on function public.get_catalog() from public;
grant execute on function public.get_catalog() to anon, authenticated;

-- 5. Start a test (login required) ---------------------------------------------
-- FULL: the whole paper in paper order.
-- UNIT: a fresh random set each time. Questions sharing a passage or table
-- (same layout_text) stay together and in order.
create or replace function public.start_test(p_mode text, p_paper_id text default null,
                                             p_unit text default null, p_count integer default 10)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_ids integer[] := '{}';
  v_group integer[];
  v_need integer;
  v_count integer := greatest(1, least(coalesce(p_count, 10), 200));
  v_duration integer;
  v_session public.test_sessions;
begin
  if v_uid is null then raise exception 'login_required'; end if;

  if p_mode = 'FULL' then
    select coalesce(array_agg(id order by question_number nulls last, id), '{}')
      into v_ids from public.questions where paper_id = p_paper_id;
    v_duration := 3600;
  elsif p_mode = 'UNIT' then
    for v_group in
      select array_agg(id order by id) from public.questions
      where unit = p_unit and not is_dropped
      group by coalesce(nullif(btrim(layout_text), ''), 'q' || id::text)
      order by random()
    loop
      v_need := v_count - coalesce(array_length(v_ids, 1), 0);
      exit when v_need <= 0;
      v_ids := v_ids || v_group[1:v_need];
    end loop;
    v_duration := greatest(coalesce(array_length(v_ids, 1), 0), 1) * 60;
  else
    raise exception 'bad_mode';
  end if;

  if coalesce(array_length(v_ids, 1), 0) = 0 then raise exception 'no_questions'; end if;

  insert into public.test_sessions(user_id, mode, paper_id, unit, question_ids, duration_seconds)
  values (v_uid, p_mode, case when p_mode = 'FULL' then p_paper_id end,
          case when p_mode = 'UNIT' then p_unit end, v_ids, v_duration)
  returning * into v_session;

  return jsonb_build_object('session_id', v_session.id, 'mode', v_session.mode,
    'paper_id', v_session.paper_id, 'unit', v_session.unit,
    'duration_seconds', v_session.duration_seconds, 'started_at', v_session.started_at,
    'server_now', now(), 'questions', public._session_questions(v_ids));
end $$;
revoke all on function public.start_test(text, text, text, integer) from public, anon;
grant execute on function public.start_test(text, text, text, integer) to authenticated;

-- 6. Resume an unfinished test ---------------------------------------------------
create or replace function public.resume_test(p_session_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_session public.test_sessions;
begin
  select * into v_session from public.test_sessions
   where id = p_session_id and user_id = auth.uid() and submitted_at is null;
  if not found then return null; end if;
  return jsonb_build_object('session_id', v_session.id, 'mode', v_session.mode,
    'paper_id', v_session.paper_id, 'unit', v_session.unit,
    'duration_seconds', v_session.duration_seconds, 'started_at', v_session.started_at,
    'server_now', now(), 'questions', public._session_questions(v_session.question_ids));
end $$;
revoke all on function public.resume_test(uuid) from public, anon;
grant execute on function public.resume_test(uuid) to authenticated;

-- 7. Submit: score on the server, save once, then reveal the key ------------------
-- Only the questions of the student's own session are scored, and each
-- session can be submitted once. A question dropped by NTA counts as correct.
create or replace function public.submit_test(p_session_id uuid, p_answers jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_session public.test_sessions;
  v_total integer; v_correct integer; v_dropped integer;
  v_breakdown jsonb; v_key jsonb; v_taken integer; v_label text; v_sub_id integer; v_name text;
  v_answers jsonb := coalesce(p_answers, '{}'::jsonb);
begin
  if v_uid is null then raise exception 'login_required'; end if;
  select * into v_session from public.test_sessions
   where id = p_session_id and user_id = v_uid for update;
  if not found then raise exception 'session_not_found'; end if;
  if v_session.submitted_at is not null then raise exception 'already_submitted'; end if;

  with qs as (
    select q.id, coalesce(q.unit, 'General') as unit, q.is_dropped, q.correct_option, q.ai_hint,
           v_answers ->> q.id::text as ans
    from public.questions q where q.id = any(v_session.question_ids)
  ), scored as (
    select *, (is_dropped or (ans ~ '^[0-3]$' and ans::int = correct_option)) as ok from qs
  )
  select count(*), count(*) filter (where ok), count(*) filter (where is_dropped),
    (select jsonb_object_agg(b.unit, jsonb_build_object('total', b.t, 'correct', b.c)) from
       (select unit, count(*) as t, count(*) filter (where ok) as c from scored group by unit) b),
    jsonb_object_agg(id::text, jsonb_build_object('correctOption', correct_option, 'aiHint', ai_hint, 'isDropped', is_dropped))
  into v_total, v_correct, v_dropped, v_breakdown, v_key from scored;

  v_taken := least(v_session.duration_seconds,
                   greatest(0, extract(epoch from now() - v_session.started_at)::int));
  v_label := case when v_session.mode = 'FULL' then 'Full Test (' || replace(v_session.paper_id, '_', ' ') || ')'
                  else v_session.unit end;
  select coalesce(u.raw_user_meta_data ->> 'full_name', 'Student') into v_name from auth.users u where u.id = v_uid;

  insert into public.test_submissions(user_id, user_email, student_name, paper_id, test_mode, total_questions,
         correct_answers, score_percentage, time_taken_seconds, unit_breakdown)
  values (v_uid, auth.jwt() ->> 'email', v_name, coalesce(v_session.paper_id, v_session.unit), v_label,
          v_total, v_correct, round(v_correct * 100.0 / nullif(v_total, 0), 2), v_taken, v_breakdown)
  returning id into v_sub_id;

  update public.test_sessions set submitted_at = now(), submission_id = v_sub_id where id = v_session.id;

  return jsonb_build_object('correctCount', v_correct, 'totalQuestions', v_total, 'droppedCount', v_dropped,
    'scorePercentage', coalesce(round(v_correct * 100.0 / nullif(v_total, 0), 2), 0),
    'timeTakenSeconds', v_taken, 'unitBreakdown', coalesce(v_breakdown, '{}'::jsonb),
    'answerKey', coalesce(v_key, '{}'::jsonb), 'saved', true, 'loggedIn', true);
end $$;
revoke all on function public.submit_test(uuid, jsonb) from public, anon;
grant execute on function public.submit_test(uuid, jsonb) to authenticated;

-- 8. Admin functions (each checks is_admin() itself) -------------------------------
create or replace function public.admin_list_reports(p_status text default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id, 'issue_type', r.issue_type, 'comment', r.comment, 'status', coalesce(r.status, 'Open'),
      'created_at', r.created_at, 'user_email', r.user_email,
      'question', jsonb_build_object('id', q.id, 'paper_id', q.paper_id, 'cycle', q.cycle, 'unit', q.unit,
        'question_number', q.question_number, 'is_dropped', q.is_dropped,
        'question_text', q.question_text, 'layout_text', q.layout_text,
        'option_a', q.option_a, 'option_b', q.option_b, 'option_c', q.option_c, 'option_d', q.option_d,
        'correct_option', q.correct_option, 'ai_hint', q.ai_hint)
    ) order by r.created_at desc), '[]'::jsonb)
    from public.report_issues r join public.questions q on q.id = r.question_id
    where p_status is null or coalesce(r.status, 'Open') = p_status);
end $$;

create or replace function public.admin_update_question(p_id integer, p_question_text text, p_layout_text text,
  p_option_a text, p_option_b text, p_option_c text, p_option_d text,
  p_correct_option integer, p_ai_hint text, p_unit text, p_is_dropped boolean) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if p_correct_option is null or p_correct_option not between 0 and 3 then raise exception 'bad_correct_option'; end if;
  update public.questions set question_text = p_question_text, layout_text = nullif(p_layout_text, ''),
    option_a = p_option_a, option_b = p_option_b, option_c = p_option_c, option_d = p_option_d,
    correct_option = p_correct_option, ai_hint = nullif(p_ai_hint, ''), unit = p_unit,
    is_dropped = coalesce(p_is_dropped, false)
  where id = p_id;
end $$;

create or replace function public.admin_set_report_status(p_id uuid, p_status text) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  update public.report_issues set status = p_status where id = p_id;
end $$;

revoke all on function public.admin_list_reports(text) from public, anon;
revoke all on function public.admin_update_question(integer, text, text, text, text, text, text, integer, text, text, boolean) from public, anon;
revoke all on function public.admin_set_report_status(uuid, text) from public, anon;
grant execute on function public.admin_list_reports(text) to authenticated;
grant execute on function public.admin_update_question(integer, text, text, text, text, text, text, integer, text, text, boolean) to authenticated;
grant execute on function public.admin_set_report_status(uuid, text) to authenticated;
