-- profiles: one row per signed-in person, created from the Google profile.
-- Design: docs/database.md §4.1. RLS policies are added with organizations,
-- because "people who share an org" needs organization_members.

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       extensions.citext not null unique,
  full_name   text check (char_length(full_name) <= 120),
  avatar_url  text,
  last_org_id uuid,                          -- where to land after sign-in; FK added with organizations
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

-- Shared by the sign-up trigger and the backfill below. Google sends the name
-- as full_name (or name) and the photo as avatar_url (or picture).
create function private.insert_profile(p_id uuid, p_email text, p_metadata jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    p_id,
    p_email,
    -- Truncate rather than fail: a long Google name must never block sign-up.
    left(nullif(btrim(coalesce(p_metadata ->> 'full_name', p_metadata ->> 'name')), ''), 120),
    nullif(btrim(coalesce(p_metadata ->> 'avatar_url', p_metadata ->> 'picture')), '')
  )
  on conflict (id) do nothing;
$$;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.insert_profile(new.id, new.email, new.raw_user_meta_data);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

revoke execute on function private.insert_profile(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

-- People who signed in before this migration have no profile yet.
select private.insert_profile(u.id, u.email, u.raw_user_meta_data)
from auth.users u
where u.email is not null;

alter table public.profiles enable row level security;

-- Default deny (auto_expose_new_tables = false); grant only what policies allow.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, last_org_id) on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;
