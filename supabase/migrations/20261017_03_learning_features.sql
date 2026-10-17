-- Step 3. Learning features: Deep Review, Revision Vault, confidence marking,
-- performance, leaderboard, topics, trends, revision notes, daily mix,
-- streak and exam countdown. Adds tables and functions; replaces
-- start_test / submit_test with versions that support the new modes.

-- 0. Helpers -------------------------------------------------------------------
create or replace function public._ist_today() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'Asia/Kolkata')::date;
$$;

-- 1. Topics --------------------------------------------------------------------
alter table public.questions add column if not exists topic text;
create index if not exists questions_unit_topic_idx on public.questions(unit, topic);
grant select (topic) on public.questions to anon, authenticated;

-- 2. Per-question record of every attempt -------------------------------------
create table if not exists public.attempt_answers (
  submission_id integer not null references public.test_submissions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id integer not null references public.questions(id) on delete cascade,
  position integer not null,
  chosen integer,
  is_correct boolean not null,
  confidence text check (confidence in ('sure', 'guess')),
  time_seconds integer,
  mistake_tag text check (mistake_tag in ('concept', 'careless', 'misread', 'time', 'confused')),
  primary key (submission_id, question_id)
);
create index if not exists attempt_answers_user_idx on public.attempt_answers(user_id, question_id);
alter table public.attempt_answers enable row level security;
revoke all on public.attempt_answers from anon, authenticated;
grant select on public.attempt_answers to authenticated;
drop policy if exists "Users read own attempt answers" on public.attempt_answers;
create policy "Users read own attempt answers" on public.attempt_answers
  for select to authenticated using ((select auth.uid()) = user_id);

-- 3. Revision Vault --------------------------------------------------------------
create table if not exists public.vault_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  kind text not null default 'custom' check (kind in ('custom', 'wrong', 'lucky')),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
create unique index if not exists vault_folders_auto_idx on public.vault_folders(user_id, kind) where kind <> 'custom';
create table if not exists public.vault_items (
  folder_id uuid not null references public.vault_folders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id integer not null references public.questions(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (folder_id, question_id)
);
create index if not exists vault_items_user_idx on public.vault_items(user_id);
alter table public.vault_folders enable row level security;
alter table public.vault_items enable row level security;
revoke all on public.vault_folders, public.vault_items from anon, authenticated;
grant select, insert, update, delete on public.vault_folders to authenticated;
grant select, insert, delete on public.vault_items to authenticated;
drop policy if exists "Own folders" on public.vault_folders;
create policy "Own folders" on public.vault_folders for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and kind = 'custom');
drop policy if exists "Own vault items" on public.vault_items;
create policy "Own vault items" on public.vault_items for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and exists (
    select 1 from public.vault_folders f where f.id = folder_id and f.user_id = (select auth.uid())));

create or replace function public._auto_folder(p_uid uuid, p_kind text) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare v_id uuid;
begin
  select id into v_id from public.vault_folders where user_id = p_uid and kind = p_kind;
  if v_id is null then
    insert into public.vault_folders(user_id, name, kind)
    values (p_uid, case p_kind when 'wrong' then 'Wrong answers' else 'Lucky guesses' end, p_kind)
    on conflict do nothing
    returning id into v_id;
    if v_id is null then
      select id into v_id from public.vault_folders where user_id = p_uid and kind = p_kind;
    end if;
  end if;
  return v_id;
end $$;
revoke all on function public._auto_folder(uuid, text) from public, anon, authenticated;

-- 4. Spaced revision queue (wrong answers come back after 1, 3, 7 days) -------
create table if not exists public.revision_queue (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id integer not null references public.questions(id) on delete cascade,
  step integer not null default 1,
  due_on date not null,
  primary key (user_id, question_id)
);
alter table public.revision_queue enable row level security;
revoke all on public.revision_queue from anon, authenticated;
grant select on public.revision_queue to authenticated;
drop policy if exists "Own revision queue" on public.revision_queue;
create policy "Own revision queue" on public.revision_queue for select to authenticated
  using ((select auth.uid()) = user_id);

-- 5. Student settings: exam date, leaderboard visibility -------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  exam_date date,
  show_on_leaderboard boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.user_settings enable row level security;
revoke all on public.user_settings from anon, authenticated;
grant select, insert, update on public.user_settings to authenticated;
drop policy if exists "Own settings" on public.user_settings;
create policy "Own settings" on public.user_settings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 6. Revision notes per unit ------------------------------------------------------
create table if not exists public.unit_notes (
  id uuid primary key default gen_random_uuid(),
  unit text not null,
  title text not null,
  body text not null,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  updated_at timestamptz not null default now()
);
create index if not exists unit_notes_unit_idx on public.unit_notes(unit, sort_order);
alter table public.unit_notes enable row level security;
revoke all on public.unit_notes from anon, authenticated;
grant select on public.unit_notes to anon, authenticated;
drop policy if exists "Published notes are public" on public.unit_notes;
create policy "Published notes are public" on public.unit_notes for select to anon, authenticated
  using (status = 'published');

create or replace function public.admin_list_notes() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(n) order by n.unit, n.sort_order, n.title), '[]'::jsonb) from public.unit_notes n);
end $$;

create or replace function public.admin_save_note(p_id uuid, p_unit text, p_title text, p_body text,
                                                  p_sort_order integer, p_status text) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if p_status not in ('draft', 'published') then raise exception 'bad_status'; end if;
  if p_id is null then
    insert into public.unit_notes(unit, title, body, sort_order, status)
    values (p_unit, p_title, p_body, coalesce(p_sort_order, 0), p_status) returning id into v_id;
  else
    update public.unit_notes set unit = p_unit, title = p_title, body = p_body,
      sort_order = coalesce(p_sort_order, 0), status = p_status, updated_at = now()
    where id = p_id returning id into v_id;
  end if;
  return v_id;
end $$;

create or replace function public.admin_delete_note(p_id uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  delete from public.unit_notes where id = p_id;
end $$;

-- 7. Test sessions: more modes ------------------------------------------------------
alter table public.test_sessions drop constraint if exists test_sessions_mode_check;
alter table public.test_sessions add constraint test_sessions_mode_check
  check (mode in ('FULL', 'UNIT', 'VAULT', 'DAILY'));
alter table public.test_sessions add column if not exists topic text;
alter table public.test_sessions add column if not exists folder_id uuid references public.vault_folders(id) on delete set null;
alter table public.test_sessions add column if not exists label text;

-- Questions of a session: now also returns the topic.
create or replace function public._session_questions(p_ids integer[]) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', q.id, 'paper_id', q.paper_id, 'cycle', q.cycle, 'unit', q.unit, 'topic', q.topic,
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

create or replace function public._session_json(s public.test_sessions) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('session_id', s.id, 'mode', s.mode, 'paper_id', s.paper_id, 'unit', s.unit,
    'topic', s.topic, 'label', s.label, 'duration_seconds', s.duration_seconds, 'started_at', s.started_at,
    'server_now', now(), 'questions', public._session_questions(s.question_ids));
$$;
revoke all on function public._session_json(public.test_sessions) from public, anon, authenticated;

-- Random groups: questions sharing a passage/table stay together.
create or replace function public._pick_grouped(p_candidates integer[], p_count integer) returns integer[]
language plpgsql volatile security definer set search_path = '' as $$
declare v_ids integer[] := '{}'; v_group integer[]; v_need integer;
begin
  for v_group in
    select array_agg(id order by id) from public.questions
    where id = any(p_candidates)
    group by coalesce(nullif(btrim(layout_text), ''), 'q' || id::text)
    order by random()
  loop
    v_need := p_count - coalesce(array_length(v_ids, 1), 0);
    exit when v_need <= 0;
    v_ids := v_ids || v_group[1:v_need];
  end loop;
  return v_ids;
end $$;
revoke all on function public._pick_grouped(integer[], integer) from public, anon, authenticated;

-- start_test gains a topic filter (UNIT), Vault retests (VAULT) and the daily mix (DAILY).
drop function if exists public.start_test(text, text, text, integer);
create or replace function public.start_test(p_mode text, p_paper_id text default null,
  p_unit text default null, p_count integer default 10, p_topic text default null, p_folder_id uuid default null)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_ids integer[] := '{}';
  v_count integer := greatest(1, least(coalesce(p_count, 10), 200));
  v_duration integer;
  v_label text;
  v_due integer[];
  v_session public.test_sessions;
begin
  if v_uid is null then raise exception 'login_required'; end if;

  if p_mode = 'FULL' then
    select coalesce(array_agg(id order by question_number nulls last, id), '{}')
      into v_ids from public.questions where paper_id = p_paper_id;
    v_duration := 3600;
    v_label := 'Full Test (' || replace(coalesce(p_paper_id, ''), '_', ' ') || ')';

  elsif p_mode = 'UNIT' then
    v_ids := public._pick_grouped((select coalesce(array_agg(id), '{}') from public.questions
               where unit = p_unit and not is_dropped and (p_topic is null or topic = p_topic)), v_count);
    v_label := coalesce(p_topic || ' (' || p_unit || ')', p_unit);

  elsif p_mode = 'VAULT' then
    if not exists (select 1 from public.vault_folders where id = p_folder_id and user_id = v_uid) then
      raise exception 'folder_not_found';
    end if;
    v_ids := public._pick_grouped((select coalesce(array_agg(question_id), '{}') from public.vault_items
               where folder_id = p_folder_id and user_id = v_uid), v_count);
    v_label := 'Vault: ' || (select name from public.vault_folders where id = p_folder_id);

  elsif p_mode = 'DAILY' then
    v_count := 10;
    -- Questions due for revision first (oldest due first), then new questions
    -- from the student's weakest units, never already in this set.
    select coalesce(array_agg(question_id order by due_on, question_id), '{}') into v_due
      from (select question_id, due_on from public.revision_queue
            where user_id = v_uid and due_on <= public._ist_today()
            order by due_on, question_id limit v_count) d;
    v_ids := v_due;
    if coalesce(array_length(v_ids, 1), 0) < v_count then
      v_ids := v_ids || public._pick_grouped((
        select coalesce(array_agg(q.id), '{}') from public.questions q
        where not q.is_dropped and q.unit is not null and not (q.id = any(v_ids))
          and q.unit in (
            select u.unit from (
              select q2.unit, avg(case when a.is_correct then 1 else 0 end) as acc, count(*) as n
              from public.questions q2
              left join public.attempt_answers a on a.question_id = q2.id and a.user_id = v_uid
              where q2.unit is not null group by q2.unit
            ) u order by coalesce(u.acc, 0.5), random() limit 3)
          and not exists (select 1 from public.attempt_answers a2 where a2.user_id = v_uid and a2.question_id = q.id)
      ), v_count - coalesce(array_length(v_ids, 1), 0));
    end if;
    -- If a strong student has seen everything in those units, top up from anywhere.
    if coalesce(array_length(v_ids, 1), 0) < v_count then
      v_ids := v_ids || public._pick_grouped((select coalesce(array_agg(id), '{}') from public.questions
                 where not is_dropped and not (id = any(v_ids))), v_count - coalesce(array_length(v_ids, 1), 0));
    end if;
    v_label := 'Daily Practice ' || to_char(public._ist_today(), 'DD Mon YYYY');
  else
    raise exception 'bad_mode';
  end if;

  if coalesce(array_length(v_ids, 1), 0) = 0 then raise exception 'no_questions'; end if;
  if v_duration is null then v_duration := greatest(array_length(v_ids, 1), 1) * 60; end if;

  insert into public.test_sessions(user_id, mode, paper_id, unit, topic, folder_id, label, question_ids, duration_seconds)
  values (v_uid, p_mode, case when p_mode = 'FULL' then p_paper_id end,
          case when p_mode = 'UNIT' then p_unit end, case when p_mode = 'UNIT' then p_topic end,
          case when p_mode = 'VAULT' then p_folder_id end, v_label, v_ids, v_duration)
  returning * into v_session;
  return public._session_json(v_session);
end $$;
revoke all on function public.start_test(text, text, text, integer, text, uuid) from public, anon;
grant execute on function public.start_test(text, text, text, integer, text, uuid) to authenticated;

create or replace function public.resume_test(p_session_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_session public.test_sessions;
begin
  select * into v_session from public.test_sessions
   where id = p_session_id and user_id = auth.uid() and submitted_at is null;
  if not found then return null; end if;
  return public._session_json(v_session);
end $$;

-- submit_test gains p_meta: {"<question id>": {"conf": "guess", "t": 42}}
drop function if exists public.submit_test(uuid, jsonb);
create or replace function public.submit_test(p_session_id uuid, p_answers jsonb, p_meta jsonb default '{}'::jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_session public.test_sessions;
  v_total integer; v_correct integer; v_dropped integer;
  v_breakdown jsonb; v_key jsonb; v_taken integer; v_label text; v_sub_id integer; v_name text;
  v_answers jsonb := coalesce(p_answers, '{}'::jsonb);
  v_meta jsonb := coalesce(p_meta, '{}'::jsonb);
  v_wrong_folder uuid; v_lucky_folder uuid;
  v_today date := public._ist_today();
begin
  if v_uid is null then raise exception 'login_required'; end if;
  select * into v_session from public.test_sessions
   where id = p_session_id and user_id = v_uid for update;
  if not found then raise exception 'session_not_found'; end if;
  if v_session.submitted_at is not null then raise exception 'already_submitted'; end if;

  create temp table _scored on commit drop as
    select q.id, x.ord as position, coalesce(q.unit, 'General') as unit, q.is_dropped, q.correct_option, q.ai_hint,
           case when (v_answers ->> q.id::text) ~ '^[0-3]$' then (v_answers ->> q.id::text)::int end as chosen,
           case when (v_meta -> q.id::text ->> 'conf') = 'guess' then 'guess'
                when (v_answers ->> q.id::text) ~ '^[0-3]$' then 'sure' end as confidence,
           case when (v_meta -> q.id::text ->> 't') ~ '^[0-9]{1,5}$' then (v_meta -> q.id::text ->> 't')::int end as time_seconds,
           -- correct, or dropped by NTA (counts as correct for everyone)
           (q.is_dropped or coalesce(case when (v_answers ->> q.id::text) ~ '^[0-3]$'
                                          then (v_answers ->> q.id::text)::int = q.correct_option end, false)) as ok
    from unnest(v_session.question_ids) with ordinality as x(id, ord)
    join public.questions q on q.id = x.id;

  select count(*), count(*) filter (where ok), count(*) filter (where is_dropped),
    (select jsonb_object_agg(b.unit, jsonb_build_object('total', b.t, 'correct', b.c)) from
       (select unit, count(*) as t, count(*) filter (where ok) as c from _scored group by unit) b),
    jsonb_object_agg(id::text, jsonb_build_object('correctOption', correct_option, 'aiHint', ai_hint, 'isDropped', is_dropped))
  into v_total, v_correct, v_dropped, v_breakdown, v_key from _scored;

  v_taken := least(v_session.duration_seconds, greatest(0, extract(epoch from now() - v_session.started_at)::int));
  v_label := coalesce(v_session.label,
               case when v_session.mode = 'FULL' then 'Full Test (' || replace(v_session.paper_id, '_', ' ') || ')'
                    else v_session.unit end);
  select coalesce(u.raw_user_meta_data ->> 'full_name', 'Student') into v_name from auth.users u where u.id = v_uid;

  insert into public.test_submissions(user_id, user_email, student_name, paper_id, test_mode, total_questions,
         correct_answers, score_percentage, time_taken_seconds, unit_breakdown)
  values (v_uid, auth.jwt() ->> 'email', v_name, coalesce(v_session.paper_id, v_session.unit, v_session.mode), v_label,
          v_total, v_correct, round(v_correct * 100.0 / nullif(v_total, 0), 2), v_taken, v_breakdown)
  returning id into v_sub_id;

  insert into public.attempt_answers(submission_id, user_id, question_id, position, chosen, is_correct, confidence, time_seconds)
  select v_sub_id, v_uid, id, position, chosen, ok, confidence, time_seconds from _scored;

  -- Vault: wrong answers, and correct answers that were guesses.
  if exists (select 1 from _scored where not ok and not is_dropped and chosen is not null) then
    v_wrong_folder := public._auto_folder(v_uid, 'wrong');
    insert into public.vault_items(folder_id, user_id, question_id)
    select v_wrong_folder, v_uid, id from _scored where not ok and not is_dropped and chosen is not null
    on conflict do nothing;
  end if;
  if exists (select 1 from _scored where ok and not is_dropped and confidence = 'guess') then
    v_lucky_folder := public._auto_folder(v_uid, 'lucky');
    insert into public.vault_items(folder_id, user_id, question_id)
    select v_lucky_folder, v_uid, id from _scored where ok and not is_dropped and confidence = 'guess'
    on conflict do nothing;
  end if;

  -- Spaced revision: wrong or guessed -> back tomorrow; right and sure on a
  -- question in the queue -> next step (3 days, then 7 days, then done).
  insert into public.revision_queue(user_id, question_id, step, due_on)
  select v_uid, id, 1, v_today + 1 from _scored
  where not is_dropped and chosen is not null and (not ok or confidence = 'guess')
  on conflict (user_id, question_id) do update set step = 1, due_on = excluded.due_on;

  update public.revision_queue r set step = r.step + 1,
         due_on = v_today + case r.step when 1 then 3 else 7 end
  from _scored s
  where r.user_id = v_uid and r.question_id = s.id and s.ok and s.confidence = 'sure' and r.step < 3;
  delete from public.revision_queue r using _scored s
  where r.user_id = v_uid and r.question_id = s.id and s.ok and s.confidence = 'sure' and r.step >= 3
    and r.due_on <= v_today;

  update public.test_sessions set submitted_at = now(), submission_id = v_sub_id where id = v_session.id;

  return jsonb_build_object('submissionId', v_sub_id, 'correctCount', v_correct, 'totalQuestions', v_total,
    'droppedCount', v_dropped,
    'scorePercentage', coalesce(round(v_correct * 100.0 / nullif(v_total, 0), 2), 0),
    'timeTakenSeconds', v_taken, 'unitBreakdown', coalesce(v_breakdown, '{}'::jsonb),
    'answerKey', coalesce(v_key, '{}'::jsonb), 'saved', true, 'loggedIn', true);
end $$;
revoke all on function public.submit_test(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.submit_test(uuid, jsonb, jsonb) to authenticated;

-- 8. Deep Review -------------------------------------------------------------------
create or replace function public.get_review(p_submission_id integer) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_sub public.test_submissions;
begin
  select * into v_sub from public.test_submissions where id = p_submission_id and user_id = auth.uid();
  if not found then raise exception 'not_found'; end if;
  return jsonb_build_object(
    'submission', to_jsonb(v_sub) - 'user_email',
    'items', (select coalesce(jsonb_agg(jsonb_build_object(
        'question', jsonb_build_object('id', q.id, 'paper_id', q.paper_id, 'cycle', q.cycle, 'unit', q.unit,
          'topic', q.topic, 'question_number', q.question_number, 'is_dropped', q.is_dropped,
          'question_text', q.question_text, 'layout_text', q.layout_text,
          'option_a', q.option_a, 'option_b', q.option_b, 'option_c', q.option_c, 'option_d', q.option_d,
          'question_text_hi', h.question_text, 'layout_text_hi', h.layout_text,
          'option_a_hi', h.option_a, 'option_b_hi', h.option_b, 'option_c_hi', h.option_c, 'option_d_hi', h.option_d),
        'correct_option', q.correct_option, 'ai_hint', q.ai_hint,
        'chosen', a.chosen, 'is_correct', a.is_correct, 'confidence', a.confidence,
        'time_seconds', a.time_seconds, 'mistake_tag', a.mistake_tag,
        'in_vault', exists (select 1 from public.vault_items v where v.user_id = a.user_id and v.question_id = q.id)
      ) order by a.position), '[]'::jsonb)
      from public.attempt_answers a
      join public.questions q on q.id = a.question_id
      left join public.questions_hindi h on h.english_question_ref_id = q.id
      where a.submission_id = v_sub.id));
end $$;

create or replace function public.set_mistake_tag(p_submission_id integer, p_question_id integer, p_tag text)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_tag is not null and p_tag not in ('concept', 'careless', 'misread', 'time', 'confused') then
    raise exception 'bad_tag';
  end if;
  update public.attempt_answers set mistake_tag = p_tag
  where submission_id = p_submission_id and question_id = p_question_id and user_id = auth.uid();
end $$;

-- 9. Performance (own data) ----------------------------------------------------------
create or replace function public.get_my_performance() returns jsonb
language sql stable security definer set search_path = '' as $$
  with a as (
    select a.*, coalesce(q.unit, 'General') as unit
    from public.attempt_answers a join public.questions q on q.id = a.question_id
    where a.user_id = auth.uid() and not q.is_dropped
  )
  select jsonb_build_object(
    'units', (select coalesce(jsonb_agg(u order by u.accuracy), '[]'::jsonb) from (
        select unit, count(*) as attempted,
               count(*) filter (where is_correct) as correct,
               round(100.0 * count(*) filter (where is_correct) / nullif(count(*), 0), 1) as accuracy,
               round(avg(time_seconds) filter (where time_seconds is not null), 1) as avg_seconds
        from a where chosen is not null group by unit) u),
    'tags', (select coalesce(jsonb_object_agg(mistake_tag, n), '{}'::jsonb) from (
        select mistake_tag, count(*) as n from a where mistake_tag is not null group by mistake_tag) t),
    'guesses', (select jsonb_build_object('total', count(*), 'correct', count(*) filter (where is_correct))
                from a where confidence = 'guess'),
    'trend', (select coalesce(jsonb_agg(t order by t.submitted_at), '[]'::jsonb) from (
        select id, test_mode, score_percentage, total_questions, correct_answers, submitted_at
        from public.test_submissions where user_id = auth.uid()
        order by submitted_at desc limit 30) t),
    'totals', (select jsonb_build_object('attempted', count(*) filter (where chosen is not null),
                 'correct', count(*) filter (where is_correct and chosen is not null),
                 'avg_seconds', round(avg(time_seconds) filter (where time_seconds is not null), 1)) from a)
  );
$$;

-- 10. Leaderboard (first attempt only; first name + initial; opt-out) ---------------
create or replace function public._display_name(p_full text) returns text
language sql immutable set search_path = '' as $$
  select case
    when p_full is null or btrim(p_full) = '' then 'Student'
    when position(' ' in btrim(p_full)) = 0 then initcap(btrim(p_full))
    else initcap(split_part(btrim(p_full), ' ', 1)) || ' ' ||
         upper(left(regexp_replace(btrim(p_full), '^.*\s', ''), 1)) || '.'
  end;
$$;

create or replace function public.get_leaderboard(p_paper_id text default null) returns jsonb
language sql stable security definer set search_path = '' as $$
  with first_attempts as (
    select distinct on (s.user_id, s.paper_id) s.user_id, s.paper_id, t.score_percentage, t.time_taken_seconds, t.submitted_at
    from public.test_sessions s
    join public.test_submissions t on t.id = s.submission_id
    where s.mode = 'FULL' and s.submitted_at is not null
    order by s.user_id, s.paper_id, s.started_at
  ), visible as (
    select f.*, public._display_name(u.raw_user_meta_data ->> 'full_name') as name
    from first_attempts f
    join auth.users u on u.id = f.user_id
    left join public.user_settings st on st.user_id = f.user_id
    where coalesce(st.show_on_leaderboard, true)
  )
  select case when p_paper_id is not null then
    (select coalesce(jsonb_agg(jsonb_build_object('rank', r, 'name', name, 'score', score_percentage,
              'time_seconds', time_taken_seconds, 'is_me', user_id = auth.uid()) order by r), '[]'::jsonb)
     from (select *, rank() over (order by score_percentage desc, time_taken_seconds asc) as r
           from visible where paper_id = p_paper_id) x where r <= 50 or user_id = auth.uid())
  else
    (select coalesce(jsonb_agg(jsonb_build_object('rank', r, 'name', name, 'score', avg_score,
              'papers', papers, 'is_me', user_id = auth.uid()) order by r), '[]'::jsonb)
     from (select user_id, name, round(avg(score_percentage), 2) as avg_score, count(*) as papers,
                  rank() over (order by avg(score_percentage) desc, count(*) desc) as r
           from visible group by user_id, name having count(*) >= 3) x where r <= 50 or user_id = auth.uid())
  end;
$$;

-- 11. Progress: streak, exam countdown, revisions due, daily mix done today ------
create or replace function public.get_my_progress() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_today date := public._ist_today();
  v_streak integer := 0;
  v_day date;
begin
  if v_uid is null then return null; end if;
  -- Streak: consecutive days (IST) with at least one submitted test, ending today or yesterday.
  v_day := v_today;
  if not exists (select 1 from public.test_submissions where user_id = v_uid
                 and (submitted_at at time zone 'Asia/Kolkata')::date = v_today) then
    v_day := v_today - 1;
  end if;
  while exists (select 1 from public.test_submissions where user_id = v_uid
                and (submitted_at at time zone 'Asia/Kolkata')::date = v_day) loop
    v_streak := v_streak + 1;
    v_day := v_day - 1;
  end loop;

  return jsonb_build_object(
    'streak', v_streak,
    'today', v_today,
    'exam_date', (select exam_date from public.user_settings where user_id = v_uid),
    'show_on_leaderboard', coalesce((select show_on_leaderboard from public.user_settings where user_id = v_uid), true),
    'revisions_due', (select count(*) from public.revision_queue where user_id = v_uid and due_on <= v_today),
    'daily_done', exists (select 1 from public.test_sessions where user_id = v_uid and mode = 'DAILY'
                          and submitted_at is not null and (submitted_at at time zone 'Asia/Kolkata')::date = v_today)
  );
end $$;

create or replace function public.save_my_settings(p_exam_date date, p_show_on_leaderboard boolean) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'login_required'; end if;
  insert into public.user_settings(user_id, exam_date, show_on_leaderboard, updated_at)
  values (auth.uid(), p_exam_date, coalesce(p_show_on_leaderboard, true), now())
  on conflict (user_id) do update set exam_date = excluded.exam_date,
    show_on_leaderboard = excluded.show_on_leaderboard, updated_at = now();
end $$;

-- 12. PYQ trends (public, no answers) -----------------------------------------------
create or replace function public.get_trends() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'by_unit', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select cycle, unit, count(*) as questions, count(distinct paper_id) as papers
        from public.questions where unit is not null group by cycle, unit) x),
    'by_topic', (select coalesce(jsonb_agg(y), '[]'::jsonb) from (
        select unit, topic, count(*) as questions, count(distinct paper_id) as papers,
               count(distinct cycle) as cycles
        from public.questions where topic is not null group by unit, topic) y),
    'papers_per_cycle', (select coalesce(jsonb_object_agg(cycle, n), '{}'::jsonb) from (
        select cycle, count(distinct paper_id) as n from public.questions group by cycle) z)
  );
$$;

-- Catalogue now also lists topics per unit.
create or replace function public.get_catalog() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'total', (select count(*) from public.questions),
    'papers', (select coalesce(jsonb_agg(p order by p.cycle, p.paper_id), '[]'::jsonb) from (
        select paper_id, cycle, count(*) as question_count
        from public.questions group by paper_id, cycle) p),
    'units', (select coalesce(jsonb_agg(u), '[]'::jsonb) from (
        select unit, count(*) as question_count from public.questions
        where unit is not null and not is_dropped group by unit) u),
    'topics', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select unit, topic, count(*) as question_count from public.questions
        where topic is not null and not is_dropped group by unit, topic) t)
  );
$$;

-- 13. Permissions for the new functions ------------------------------------------------
revoke all on function public.get_review(integer) from public, anon;
revoke all on function public.set_mistake_tag(integer, integer, text) from public, anon;
revoke all on function public.get_my_performance() from public, anon;
revoke all on function public.get_leaderboard(text) from public, anon;
revoke all on function public.get_my_progress() from public, anon;
revoke all on function public.save_my_settings(date, boolean) from public, anon;
revoke all on function public.admin_list_notes() from public, anon;
revoke all on function public.admin_save_note(uuid, text, text, text, integer, text) from public, anon;
revoke all on function public.admin_delete_note(uuid) from public, anon;
revoke all on function public.get_trends() from public;
grant execute on function public.get_review(integer) to authenticated;
grant execute on function public.set_mistake_tag(integer, integer, text) to authenticated;
grant execute on function public.get_my_performance() to authenticated;
grant execute on function public.get_leaderboard(text) to authenticated;
grant execute on function public.get_my_progress() to authenticated;
grant execute on function public.save_my_settings(date, boolean) to authenticated;
grant execute on function public.admin_list_notes() to authenticated;
grant execute on function public.admin_save_note(uuid, text, text, text, integer, text) to authenticated;
grant execute on function public.admin_delete_note(uuid) to authenticated;
grant execute on function public.get_trends() to anon, authenticated;
