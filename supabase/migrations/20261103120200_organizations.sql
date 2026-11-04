-- organizations, organization_members, the RLS helper functions and the
-- policies that depend on membership (including profiles).
-- Design: docs/database.md §4.2, §4.3, §5, §7.

create table public.organizations (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 2 and 80),
  slug           extensions.citext not null unique
                 -- ::text so the match is case-sensitive (citext's ~ ignores case)
                 check (slug::text ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  timezone       text not null,               -- IANA name, e.g. 'Asia/Karachi'
  week_starts_on smallint not null default 1 check (week_starts_on between 0 and 6),
  created_by     uuid not null references public.profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create index organizations_created_by on public.organizations (created_by);

create table public.organization_members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.member_role not null default 'member',
  status      public.member_status not null default 'active',
  job_title   text check (char_length(job_title) <= 80),
  schedule_id uuid,                          -- future: per-member schedule override
  joined_at   timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, user_id)
);

create index organization_members_user_active
  on public.organization_members (user_id, org_id) where status = 'active';

alter table public.profiles
  add constraint profiles_last_org_id_fkey
  foreign key (last_org_id) references public.organizations (id) on delete set null;

create index profiles_last_org_id on public.profiles (last_org_id);

-- Triggers --------------------------------------------------------------------

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function private.set_updated_at();

create trigger organization_members_set_updated_at
before update on public.organization_members
for each row execute function private.set_updated_at();

create function private.validate_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'invalid_timezone' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger organizations_validate_timezone
before insert or update of timezone on public.organizations
for each row execute function private.validate_timezone();

-- An org always keeps at least one active owner. Security definer so it sees
-- every member, whatever the caller's RLS allows.
create function private.ensure_owner_remains()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role <> 'owner' or old.status <> 'active' then
    return coalesce(new, old);
  end if;

  if tg_op = 'UPDATE' and new.role = 'owner' and new.status = 'active' then
    return new;
  end if;

  -- The org itself is being deleted (cascade), so there is nothing to protect.
  -- Locking the org row also serializes two owners demoting each other at once.
  perform 1 from public.organizations where id = old.org_id for update;
  if not found then
    return coalesce(new, old);
  end if;

  if not exists (
    select 1
    from public.organization_members
    where org_id = old.org_id
      and id <> old.id
      and role = 'owner'
      and status = 'active'
  ) then
    raise exception 'last_owner'
      using errcode = 'P0001', hint = 'Make someone else an owner first.';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger organization_members_ensure_owner_remains
before update or delete on public.organization_members
for each row execute function private.ensure_owner_remains();

revoke execute on function private.validate_timezone() from public, anon, authenticated;
revoke execute on function private.ensure_owner_remains() from public, anon, authenticated;

-- RLS helpers (docs/database.md §5.1) -----------------------------------------
-- Policies use `org_id in (select private.member_org_ids())`: Postgres runs the
-- subquery once per statement (initPlan) instead of once per row.

create function private.member_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select org_id
  from public.organization_members
  where user_id = (select auth.uid()) and status = 'active'
$$;

create function private.admin_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select org_id
  from public.organization_members
  where user_id = (select auth.uid())
    and status = 'active'
    and role in ('owner', 'admin')
$$;

revoke execute on function private.member_org_ids() from public, anon;
revoke execute on function private.admin_org_ids() from public, anon;
grant execute on function private.member_org_ids() to authenticated;
grant execute on function private.admin_org_ids() to authenticated;

-- organizations ---------------------------------------------------------------
-- Created only through create_organization(); soft-deleted by an owner via RPC.

alter table public.organizations enable row level security;

revoke all on table public.organizations from anon, authenticated;
grant select on table public.organizations to authenticated;
grant update (name, slug, timezone, week_starts_on) on table public.organizations to authenticated;
grant select, insert, update, delete on table public.organizations to service_role;

create policy organizations_select on public.organizations
for select to authenticated
using (id in (select private.member_org_ids()));

create policy organizations_update on public.organizations
for update to authenticated
using (id in (select private.admin_org_ids()))
with check (id in (select private.admin_org_ids()));

-- organization_members --------------------------------------------------------
-- Read-only for users: memberships change only through RPCs
-- (create_organization now; accept_invitation, change_member_role later).

alter table public.organization_members enable row level security;

revoke all on table public.organization_members from anon, authenticated;
grant select on table public.organization_members to authenticated;
grant select, insert, update, delete on table public.organization_members to service_role;

create policy organization_members_select on public.organization_members
for select to authenticated
using (org_id in (select private.member_org_ids()));

-- profiles --------------------------------------------------------------------

create policy profiles_select on public.profiles
for select to authenticated
using (
  id = (select auth.uid())
  or id in (
    select m.user_id
    from public.organization_members m
    where m.org_id in (select private.member_org_ids())
  )
);

-- Column grants limit this to full_name and last_org_id; the check stops
-- anyone pointing last_org_id at an org they don't belong to.
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and (last_org_id is null or last_org_id in (select private.member_org_ids()))
);
