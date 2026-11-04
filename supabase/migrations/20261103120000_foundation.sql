-- Foundation: extensions, the private schema and shared trigger helpers.
-- Design: docs/database.md §1, §3, §7.

create extension if not exists citext with schema extensions;      -- case-insensitive emails and slugs
create extension if not exists btree_gist with schema extensions;  -- uuid equality in exclusion constraints (time_entries, leave_requests)

-- Not exposed through the Data API (supabase/config.toml only exposes public).
-- RLS policies call the helpers in here, so signed-in users need USAGE.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.member_role as enum ('owner', 'admin', 'member');
create type public.member_status as enum ('active', 'deactivated');

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;
