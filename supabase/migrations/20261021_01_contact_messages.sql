-- Contact form messages. Visitors can only send through submit_contact_message();
-- they cannot read the table. Only admins (app_admins) can list and resolve messages.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 5 and 200),
  topic text not null check (char_length(topic) <= 60),
  message text not null check (char_length(message) between 10 and 3000),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'Open' check (status in ('Open', 'Resolved'))
);
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);
alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;

create or replace function public.submit_contact_message(p_name text, p_email text, p_topic text, p_message text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if btrim(coalesce(p_name, '')) = '' or char_length(p_name) > 100
     or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 200
     or char_length(btrim(coalesce(p_message, ''))) not between 10 and 3000 then
    raise exception 'bad_input';
  end if;
  -- Simple throttle: at most 5 messages per email address per hour.
  if (select count(*) from public.contact_messages
      where email = v_email and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'too_many';
  end if;
  insert into public.contact_messages (name, email, topic, message, user_id)
  values (btrim(p_name), v_email, left(coalesce(p_topic, 'Other'), 60), btrim(p_message), auth.uid());
end $$;

create or replace function public.admin_list_messages(p_status text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(m) - 'user_id' order by m.created_at desc), '[]'::jsonb)
          from public.contact_messages m where p_status is null or m.status = p_status);
end $$;

create or replace function public.admin_set_message_status(p_id uuid, p_status text)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if p_status not in ('Open', 'Resolved') then raise exception 'bad_status'; end if;
  update public.contact_messages set status = p_status where id = p_id;
end $$;

revoke all on function public.submit_contact_message(text, text, text, text) from public;
revoke all on function public.admin_list_messages(text) from public, anon;
revoke all on function public.admin_set_message_status(uuid, text) from public, anon;
grant execute on function public.submit_contact_message(text, text, text, text) to anon, authenticated;
grant execute on function public.admin_list_messages(text) to authenticated;
grant execute on function public.admin_set_message_status(uuid, text) to authenticated;
