-- time_entries (one row per clock-in → clock-out session) and the append-only
-- audit_log. Nobody writes either directly: clock_in / clock_out and the
-- auto-close job do, as security-definer functions.
-- Design: docs/database.md §4.7, §4.8, §5.2.

create type public.entry_source as enum ('web', 'mobile', 'admin', 'system');

create table public.time_entries (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null,
  user_id          uuid not null,
  work_date        date not null,              -- org-local date of clock_in_at
  clock_in_at      timestamptz not null default now(),
  clock_out_at     timestamptz,
  clock_in_source  public.entry_source not null default 'web',
  clock_out_source public.entry_source,
  auto_closed      boolean not null default false,
  note             text check (char_length(note) <= 500),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Only members have sessions; they go with the membership (and the org).
  foreign key (org_id, user_id)
    references public.organization_members (org_id, user_id) on delete cascade,
  check (clock_out_at is null or clock_out_at >= clock_in_at),
  check (clock_out_at is null or clock_out_at - clock_in_at <= interval '24 hours'),
  check ((clock_out_at is null) = (clock_out_source is null)),
  check (not auto_closed or clock_out_at is not null),
  -- No two sessions of one person overlap. An open session runs to infinity,
  -- so it is always that person's latest one.
  constraint time_entries_no_overlap exclude using gist (
    org_id with =,
    user_id with =,
    tstzrange(clock_in_at, clock_out_at, '[)') with &&
  )
);

-- At most one open session per person: double clicks and second tabs fail safely.
create unique index time_entries_one_open
  on public.time_entries (org_id, user_id) where clock_out_at is null;
-- A person's days (dashboard, timesheet); also covers the composite foreign key.
create index time_entries_member_date
  on public.time_entries (org_id, user_id, work_date);
-- The auto-close job's scan.
create index time_entries_open
  on public.time_entries (clock_in_at) where clock_out_at is null;

create trigger time_entries_set_updated_at
before update on public.time_entries
for each row execute function private.set_updated_at();

create table public.audit_log (
  id          bigint generated always as identity primary key,
  org_id      uuid not null references public.organizations (id) on delete cascade,
  actor_id    uuid references public.profiles (id) on delete set null,  -- null = system (cron)
  action      text not null check (action ~ '^[a-z_]+\.[a-z_]+$'),     -- 'time_entry.auto_closed'
  entity_type text not null,
  entity_id   uuid,
  before      jsonb,
  after       jsonb,
  reason      text check (char_length(reason) <= 500),
  created_at  timestamptz not null default now()
);

create index audit_log_org_created on public.audit_log (org_id, created_at desc);
create index audit_log_actor_id on public.audit_log (actor_id);

-- time_entries: read your own, or everyone's in orgs you administer ----------

alter table public.time_entries enable row level security;

revoke all on table public.time_entries from anon, authenticated;
grant select on table public.time_entries to authenticated;
grant select, insert, update, delete on table public.time_entries to service_role;

create policy time_entries_select on public.time_entries
for select to authenticated
using (
  (user_id = (select auth.uid()) and org_id in (select private.member_org_ids()))
  or org_id in (select private.admin_org_ids())
);

-- audit_log: admins read their org's history; nobody edits it -----------------

alter table public.audit_log enable row level security;

revoke all on table public.audit_log from anon, authenticated;
grant select on table public.audit_log to authenticated;
grant select, insert on table public.audit_log to service_role;

create policy audit_log_select on public.audit_log
for select to authenticated
using (org_id in (select private.admin_org_ids()));
