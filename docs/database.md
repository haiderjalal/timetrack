# TimeTrack: Database Design

> Status: **v0.2** · Engine: Supabase Postgres · Date: 2026-11-03
> This is the design spec. Phase 1 tables are built (see [§10](#10-implementation-status)); the rest arrive with their roadmap phase, through ordered migrations in `supabase/migrations/`.

---

## 1. Principles

- **UUID primary keys** (`gen_random_uuid()`) on all business tables. The one exception is the append-only `audit_log`, which uses `bigint identity` because it is write-heavy and never referenced externally.
- **snake_case**, plural table names, UTC `timestamptz` everywhere. `created_at` / `updated_at` are set by the database.
- **Soft delete** for business entities (`deleted_at` on orgs; `status = 'deactivated'` on members). Attendance history is never hard-deleted.
- **Constraints first**: `NOT NULL`, `CHECK`, composite `FOREIGN KEY`s that stop cross-org references, partial unique indexes, and exclusion constraints.
- **RLS on every table, default deny.** Sensitive writes go only through `security definer` RPC functions that check the caller themselves.
- **Every foreign key and RLS column is indexed.** Every query has a matching composite index.

## 2. Entity relationships

```
auth.users 1─1 profiles
                 │
                 │ 1─*                     1─*
organizations ───┼──── organization_members ───── time_entries
   │  │  │  │    │            │  (org_id,user_id)    │
   │  │  │  │    │            └───────────────────── leave_requests ──* leave_types
   │  │  │  └─── invitations                                              │
   │  │  └────── work_schedules 1─7 work_schedule_days                    │
   │  └───────── holidays                                                 │
   └──────────── audit_log                       organizations 1─* ───────┘
```

`time_entries` and `leave_requests` reference **`organization_members(org_id, user_id)`** (composite FK), so a row can't exist for someone who isn't a member of that org.

## 3. Types and extensions

```sql
create extension if not exists citext;      -- case-insensitive emails and slugs
create extension if not exists btree_gist;  -- uuid equality inside exclusion constraints
-- pg_cron is enabled from the Supabase dashboard (Database → Extensions)

create schema if not exists private;        -- NOT exposed through the Data API

create type public.member_role    as enum ('owner', 'admin', 'member');
create type public.member_status  as enum ('active', 'deactivated');
create type public.entry_source   as enum ('web', 'mobile', 'admin', 'system');
create type public.leave_status   as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.leave_duration as enum ('full_day', 'first_half', 'second_half');
```

## 4. Tables

### 4.1 `profiles`: one row per signed-in person

```sql
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        citext not null unique,
  full_name    text check (char_length(full_name) <= 120),
  avatar_url   text,
  last_org_id  uuid,                          -- where to land after sign-in
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
```

Filled by a `security definer` trigger on `auth.users` insert, using the Google profile (`raw_user_meta_data`).

### 4.2 `organizations`

```sql
create table public.organizations (
  id              uuid primary key default gen_random_uuid(),
  name            text   not null check (char_length(name) between 2 and 80),
  slug            citext not null unique
                  check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  timezone        text   not null,            -- IANA name, e.g. 'Asia/Karachi'
  week_starts_on  smallint not null default 1 check (week_starts_on between 0 and 6),
  created_by      uuid not null references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
```

A trigger checks `timezone` against `pg_timezone_names`, so an invalid zone can never be stored.

### 4.3 `organization_members`

```sql
create table public.organization_members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.member_role   not null default 'member',
  status      public.member_status not null default 'active',
  job_title   text check (char_length(job_title) <= 80),
  schedule_id uuid,                            -- future: per-member schedule override
  joined_at   timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, user_id)
);
create index organization_members_user_active
  on public.organization_members (user_id, org_id) where status = 'active';
```

Trigger `private.ensure_owner_remains`: blocks any update or delete that would leave an org with zero active owners.

### 4.4 `invitations`

```sql
create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  email        citext not null,
  role         public.member_role not null default 'member' check (role <> 'owner'),
  token_hash   bytea not null unique,           -- sha256(token); raw token only in the email
  invited_by   uuid not null references public.profiles (id),
  expires_at   timestamptz not null default now() + interval '7 days',
  accepted_at  timestamptz,
  accepted_by  uuid references public.profiles (id),
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);
create unique index invitations_one_open_per_email
  on public.invitations (org_id, email) where accepted_at is null and revoked_at is null;
```

Re-inviting someone revokes their previous open invitation and creates a new one.

### 4.5 `work_schedules` + `work_schedule_days`: versioned working hours

Changing working hours **creates a new version** with an `effective_from` date, so past months are still calculated with the hours that applied at the time.

```sql
create table public.work_schedules (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations (id) on delete cascade,
  effective_from  date not null,
  grace_minutes   smallint not null default 15 check (grace_minutes between 0 and 120),
  created_by      uuid not null references public.profiles (id),
  created_at      timestamptz not null default now(),
  unique (org_id, effective_from)
);

create table public.work_schedule_days (
  schedule_id       uuid not null references public.work_schedules (id) on delete cascade,
  weekday           smallint not null check (weekday between 0 and 6),   -- 0 = Sunday
  is_working_day    boolean  not null,
  start_time        time,
  end_time          time,                     -- end < start means the shift crosses midnight
  required_minutes  smallint not null default 480 check (required_minutes between 0 and 1440),
  primary key (schedule_id, weekday),
  check (not is_working_day or (start_time is not null and end_time is not null))
);
```

### 4.6 `holidays`

```sql
create table public.holidays (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  holiday_date  date not null,
  name          text not null check (char_length(name) between 1 and 80),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (org_id, holiday_date)
);
```

### 4.7 `time_entries`: one row per clock-in/clock-out session

```sql
create table public.time_entries (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null,
  user_id           uuid not null,
  work_date         date not null,                  -- org-local date of clock_in_at
  clock_in_at       timestamptz not null default now(),
  clock_out_at      timestamptz,
  clock_in_source   public.entry_source not null default 'web',
  clock_out_source  public.entry_source,
  auto_closed       boolean not null default false,
  note              text check (char_length(note) <= 500),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  foreign key (org_id, user_id) references public.organization_members (org_id, user_id),
  check (clock_out_at is null or clock_out_at >= clock_in_at),
  check (clock_out_at is null or clock_out_at - clock_in_at <= interval '24 hours'),
  -- no two sessions of the same person may overlap (protects admin edits too)
  exclude using gist (
    org_id with =, user_id with =,
    tstzrange(clock_in_at, clock_out_at, '[)') with &&
  )
);

-- at most ONE open session per member: double clicks and second tabs fail safely
create unique index time_entries_one_open
  on public.time_entries (org_id, user_id) where clock_out_at is null;

create index time_entries_org_date     on public.time_entries (org_id, work_date);
create index time_entries_member_date  on public.time_entries (org_id, user_id, work_date);
create index time_entries_open         on public.time_entries (clock_in_at) where clock_out_at is null;
```

### 4.8 `audit_log`: append-only

```sql
create table public.audit_log (
  id           bigint generated always as identity primary key,
  org_id       uuid not null references public.organizations (id) on delete cascade,
  actor_id     uuid references public.profiles (id),      -- null = system (cron)
  action       text not null,                             -- 'time_entry.adjusted', 'member.role_changed', ...
  entity_type  text not null,
  entity_id    uuid,
  before       jsonb,
  after        jsonb,
  reason       text check (char_length(reason) <= 500),
  created_at   timestamptz not null default now()
);
create index audit_log_org_created on public.audit_log (org_id, created_at desc);
```

No UPDATE or DELETE privilege for any app role. Rows are only written by RPCs and triggers.

### 4.9 `leave_types` + `leave_requests`

```sql
create table public.leave_types (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations (id) on delete cascade,
  name               text not null check (char_length(name) between 1 and 40),
  color_token        text not null default 'leave',     -- design token, never a raw hex
  is_paid            boolean not null default true,
  yearly_quota_days  numeric(4,1),                       -- null = no limit
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (org_id, name),
  unique (org_id, id)                                    -- target for composite FK
);

create table public.leave_requests (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null,
  user_id        uuid not null,
  leave_type_id  uuid not null,
  start_date     date not null,
  end_date       date not null,
  duration       public.leave_duration not null default 'full_day',
  reason         text check (char_length(reason) <= 1000),
  status         public.leave_status not null default 'pending',
  reviewed_by    uuid references public.profiles (id),
  reviewed_at    timestamptz,
  review_note    text check (char_length(review_note) <= 500),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  foreign key (org_id, user_id)       references public.organization_members (org_id, user_id),
  foreign key (org_id, leave_type_id) references public.leave_types (org_id, id),
  check (end_date >= start_date),
  check (duration = 'full_day' or start_date = end_date),     -- half days are single-day
  check ((status in ('approved', 'rejected')) = (reviewed_at is not null)),
  exclude using gist (
    org_id with =, user_id with =,
    daterange(start_date, end_date, '[]') with &&
  ) where (status in ('pending', 'approved'))
);
create index leave_requests_org_status on public.leave_requests (org_id, status, start_date);
create index leave_requests_member     on public.leave_requests (org_id, user_id, start_date);
```

Known limitation: the exclusion constraint also blocks a _first-half_ and a _second-half_ request on the same day. Users choose full day instead. Revisit if needed.

Default leave types seeded on org creation: **Casual**, **Sick**, **Annual**, **Unpaid** (`is_paid = false`).

## 5. Row Level Security

### 5.1 Helper functions (private schema, evaluated once per query)

```sql
create or replace function private.member_org_ids()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select org_id from public.organization_members
  where user_id = (select auth.uid()) and status = 'active'
$$;

create or replace function private.admin_org_ids()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select org_id from public.organization_members
  where user_id = (select auth.uid()) and status = 'active'
    and role in ('owner', 'admin')
$$;

grant usage on schema private to authenticated;
revoke execute on all functions in schema private from public, anon;
grant execute on function private.member_org_ids(), private.admin_org_ids() to authenticated;
```

Policies use `org_id in (select private.member_org_ids())`. Postgres runs the subquery **once** (initPlan) and probes the index, instead of calling a function for every row. That makes RLS roughly 100× cheaper on large tables. The `private` schema isn't exposed through the Data API, so these functions can't be called directly from the browser.

### 5.2 Policy matrix

| Table                                  | SELECT                         | INSERT                                          | UPDATE                                        | DELETE                           |
| -------------------------------------- | ------------------------------ | ----------------------------------------------- | --------------------------------------------- | -------------------------------- |
| `profiles`                             | self + people who share an org | trigger only                                    | self (`full_name`, `last_org_id`)             | –                                |
| `organizations`                        | member orgs                    | RPC `create_organization`                       | admin orgs                                    | – (soft delete by owner via RPC) |
| `organization_members`                 | member orgs                    | RPC `accept_invitation` / `create_organization` | RPC `change_member_role`, `deactivate_member` | –                                |
| `invitations`                          | admin orgs                     | admin orgs                                      | admin orgs (revoke)                           | –                                |
| `work_schedules`, `work_schedule_days` | member orgs                    | admin orgs                                      | – (immutable versions)                        | –                                |
| `holidays`                             | member orgs                    | admin orgs                                      | admin orgs                                    | admin orgs                       |
| `time_entries`                         | own rows **or** admin orgs     | RPC `clock_in`                                  | RPC `clock_out`, `adjust_time_entry`          | –                                |
| `leave_types`                          | member orgs                    | admin orgs                                      | admin orgs                                    | – (deactivate instead)           |
| `leave_requests`                       | own rows **or** admin orgs     | own, `status = 'pending'`, unreviewed           | RPC `cancel_leave`, `review_leave`            | –                                |
| `audit_log`                            | admin orgs                     | RPC / triggers only                             | –                                             | –                                |

Example:

```sql
alter table public.time_entries enable row level security;

create policy time_entries_select on public.time_entries
for select to authenticated
using (
  (user_id = (select auth.uid()) and org_id in (select private.member_org_ids()))
  or org_id in (select private.admin_org_ids())
);
-- no insert / update / delete policies: members cannot write directly
revoke insert, update, delete on public.time_entries from anon, authenticated;
```

### 5.3 Proving isolation

pgTAP tests in `supabase/tests/` (run in CI) check, among others:

- Member of org A gets **0 rows** from every table of org B.
- A member can't `insert` / `update` `time_entries` directly, can't set `status = 'approved'` on their own leave, and can't read other members' entries.
- An admin can't promote anyone to owner, and the last owner can't be demoted.
- `anon` can read nothing.

## 6. RPC functions

All are `security definer`, `set search_path = ''`, and **check `auth.uid()` and membership in the function body**. `execute` is revoked from `anon` and granted to `authenticated`.

| Function                                                               | Who            | Does                                                                                    |
| ---------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------- |
| `create_organization(name, slug, timezone, schedule jsonb)`            | any user       | org + owner membership + first schedule + default leave types (one transaction)         |
| `accept_invitation(token text)`                                        | invitee        | verifies hash, expiry, revocation, **email match**; creates membership; marks accepted  |
| `clock_in(org_id, source)`                                             | member         | inserts with `now()` and the org-local `work_date`; returns `(entry, server_now)`       |
| `clock_out(org_id, note)`                                              | member         | closes _my_ open entry with `now()`                                                     |
| `adjust_time_entry(entry_id, clock_in_at, clock_out_at, reason)`       | admin          | edits or creates an entry; reason required; writes `audit_log`                          |
| `review_leave(request_id, decision, note)`                             | admin          | approve or reject a pending request; sets `reviewed_by` and `reviewed_at`; writes audit |
| `cancel_leave(request_id)`                                             | requester      | cancels own pending request (or approved, if it hasn't started)                         |
| `change_member_role(org_id, user_id, role)` / `deactivate_member(...)` | owner / admin  | role rules + last-owner protection + audit                                              |
| `get_daily_totals(org_id, from, to)`                                   | member / admin | **`security invoker`** (RLS applies): per user, per day sums                            |

Sketch, `clock_in`:

```sql
create or replace function public.clock_in(
  p_org_id uuid,
  p_source public.entry_source default 'web'
) returns public.time_entries
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_tz    text;
  v_entry public.time_entries;
begin
  select o.timezone into v_tz
  from public.organizations o
  join public.organization_members m on m.org_id = o.id
  where o.id = p_org_id and o.deleted_at is null
    and m.user_id = v_uid and m.status = 'active';

  if v_tz is null then
    raise exception 'not_a_member' using errcode = '42501';
  end if;

  insert into public.time_entries (org_id, user_id, work_date, clock_in_source)
  values (p_org_id, v_uid, (now() at time zone v_tz)::date, p_source)
  returning * into v_entry;

  return v_entry;
exception
  when unique_violation then
    raise exception 'already_clocked_in' using errcode = 'P0001';
end;
$$;
```

Sketch, `get_daily_totals` (the report aggregate):

```sql
create or replace function public.get_daily_totals(p_org_id uuid, p_from date, p_to date)
returns table (
  user_id uuid, work_date date, worked_seconds integer,
  first_in timestamptz, last_out timestamptz,
  open_sessions integer, auto_closed_sessions integer
)
language sql stable security invoker set search_path = ''
as $$
  select t.user_id, t.work_date,
         coalesce(sum(extract(epoch from (t.clock_out_at - t.clock_in_at))), 0)::integer,
         min(t.clock_in_at), max(t.clock_out_at),
         (count(*) filter (where t.clock_out_at is null))::integer,
         (count(*) filter (where t.auto_closed))::integer
  from public.time_entries t
  where t.org_id = p_org_id and t.work_date between p_from and p_to
  group by t.user_id, t.work_date
$$;
```

This uses `time_entries_org_date`. Because it is `security invoker`, a member calling it only sees their own days, so the same function also powers the personal timesheet.

## 7. Triggers and jobs

| Name                           | Type                                           | Purpose                                                                                                    |
| ------------------------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `private.handle_new_user`      | `after insert on auth.users`                   | create `profiles` row from the Google profile                                                              |
| `private.set_updated_at`       | `before update` on mutable tables              | maintain `updated_at`                                                                                      |
| `private.ensure_owner_remains` | `before update/delete on organization_members` | never zero owners                                                                                          |
| `private.validate_timezone`    | `before insert/update on organizations`        | IANA zone must exist                                                                                       |
| `private.broadcast_presence`   | `after insert/update on time_entries`          | `realtime.broadcast_changes` to the private channel `org:{id}:presence` (Realtime RLS limits it to admins) |
| `auto-close-stale-entries`     | `pg_cron`, every 15 min                        | close forgotten sessions, mark `auto_closed`, write audit                                                  |
| `expire-invitations`           | `pg_cron`, daily                               | housekeeping for expired invites                                                                           |

## 8. Scaling path

| Stage        | Trigger                             | Change                                                                                                                                                                                                                                |
| ------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v1           | n/a                                 | Single table per entity, composite indexes above                                                                                                                                                                                      |
| Rollups      | Report p95 > 500 ms                 | `daily_attendance(org_id, user_id, work_date, worked_seconds, …)` maintained on clock-out and adjustment; reports read the rollup                                                                                                     |
| Read replica | Reports or exports slow down writes | Route `get_daily_totals` and exports to a Supabase read replica                                                                                                                                                                       |
| Partitioning | `time_entries` > ~100M rows         | Range-partition by `work_date` (monthly). A unique index on a partitioned table must include the partition key, so "one open session per member" moves into a small `active_sessions(org_id, user_id)` table with its own primary key |

## 9. Connection and query rules

- The app uses **`supabase-js` over HTTP** (no direct Postgres connections from Vercel functions). Any direct connection (migrations, scripts) goes through the Supavisor pooler.
- Never `select *`: repositories list columns explicitly, so types stay narrow and payloads stay small.
- Lists use **keyset pagination** (`(work_date, id) < (…)`), not `OFFSET`.
- Monthly reports read one org-month **range** through the composite index, then aggregate in SQL. No N+1 queries: members, totals, leave and holidays load in four parallel queries.
- `pg_stat_statements` is reviewed before each release; `EXPLAIN ANALYZE` is attached to any PR that adds a query on `time_entries`.

## 10. Implementation status

### Built in Phase 1 (`feature/onboarding`)

| Migration (`supabase/migrations/`)             | Contents                                                                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `20261103120000_foundation.sql`                | `citext`, `btree_gist`, the `private` schema, `member_role` / `member_status`, `private.set_updated_at()`                                         |
| `20261103120100_profiles.sql`                  | `profiles`, `private.handle_new_user` on `auth.users`, a backfill for people who signed in earlier                                                |
| `20261103120200_organizations.sql`             | `organizations`, `organization_members`, `ensure_owner_remains`, `validate_timezone`, `member_org_ids()` / `admin_org_ids()`, membership policies |
| `20261103120300_schedules_and_leave_types.sql` | `work_schedules`, `work_schedule_days`, `leave_types` and their policies                                                                          |
| `20261103120400_create_organization.sql`       | `create_organization(p_name, p_slug, p_timezone, p_schedule)`                                                                                     |

pgTAP tests live in `supabase/tests/database/` (69 assertions): default-deny grants, the profile
trigger, `create_organization`, and tenant isolation by role (org A sees nothing of org B, members
can't write admin data, the last owner stays, deactivated members lose access). Run them with
`npx supabase test db` (needs Docker). Types for the app are in `src/types/database.types.ts`;
regenerate them after every migration with
`npx supabase gen types typescript --linked > src/types/database.types.ts`.

### Decisions made while building

- **Enum types are created with the table that uses them.** `entry_source`, `leave_status` and
  `leave_duration` arrive with `time_entries` and `leave_requests`.
- **`profiles.last_org_id` has a foreign key** to `organizations` (`on delete set null`) and an
  index. Users may update it (column grant), but only to an org they're an active member of.
- **Grants are explicit both ways.** Every migration first revokes `anon` / `authenticated` and then
  grants exact privileges, column by column for updates (for example `organizations`: `name`,
  `slug`, `timezone`, `week_starts_on`). `service_role` gets table privileges for maintenance code.
  This holds whether or not a hosted project has `auto_expose_new_tables` turned off.
- **`slug` is checked as `slug::text`.** On `citext`, `~` ignores case, which would let `Acme` past
  the lowercase-only pattern. Uniqueness still ignores case.
- **A day off stores no times and `required_minutes = 0`.**
- **`leave_types.color_token`** is checked to look like a token name (`^[a-z][a-z-]{0,39}$`) so a raw
  hex value can't be stored.
- **`created_by` columns are indexed**, so every foreign key is.
- **`ensure_owner_remains`** lets a whole org be deleted (its cascade) but blocks deleting the auth
  user who is an org's last owner: ownership has to move first.
- **`create_organization` errors** are short codes the app maps to friendly messages:
  `not_authenticated` (42501), `invalid_schedule` / `invalid_input` / `invalid_timezone` (22023) and
  `slug_taken` (P0001). Postgres wording never reaches the browser.
- **Profiles and their email** come from Google at sign-up. Later Google profile changes don't sync
  yet.

### Built in Phase 3 (`feature/time-tracking`)

| Migration (`supabase/migrations/`) | Contents                                                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `20261103130000_time_entries.sql`  | `entry_source`, `time_entries` (§4.7) and `audit_log` (§4.8) with their grants and policies                      |
| `20261103130100_auto_close.sql`    | `private.auto_close_plan()`, `private.close_stale_entries()` and the `auto-close-stale-entries` pg_cron job (§7) |
| `20261103130200_clock_in_out.sql`  | `clock_in(p_org_id, p_source)` and `clock_out(p_org_id, p_note, p_source)`                                       |

pgTAP: `04_time_entries.test.sql` (41 assertions) plus 4 more in `00_schema.test.sql`, 114 in total.
They cover clocking in and out, every auto-close case (working day, after hours, day off, night
shift, the 24h cap, schedule versions), the audit entries, who can read sessions and the audit log,
that nobody writes either directly, and the overlap, 24h and membership constraints.

- **Auto-close is capped at 24h.** A clock-in at 00:30 for a 22:00–06:00 shift would otherwise stay
  open for 33h, past the 24h limit on a session (business-rules §3.5). Both thresholds use
  `least(…, clock_in_at + 24h)`.
- **"Ends the next day" means `end_time <= start_time`**, in the job and in the app
  (`crossesMidnight()`), so a shift with equal start and end times is 24h long.
- **`clock_in` / `clock_out` close the caller's own stale session first.** If pg_cron misses a run
  (or isn't available, as in the PGlite test run), nobody gets stuck behind an old open session.
- **`clock_out` takes `p_source`** like `clock_in`, so `clock_out_source` can say `mobile` later.
  Members may only pass `web` or `mobile`; `admin` and `system` are for corrections and the job.
- **Error codes:** `not_authenticated` / `not_a_member` (42501), `invalid_input` (22023),
  `already_clocked_in` / `not_clocked_in` / `session_overlap` (P0001). An open session overlaps
  any new one, so a second clock-in usually trips the no-overlap constraint before the
  one-open-session index; both report `already_clocked_in` when an open session exists.
- **`time_entries` and `audit_log` grant only `SELECT`** to signed-in users. Even admins change
  sessions through a function (`adjust_time_entry`, Phase 4), which writes the audit entry.
- **`audit_log.actor_id` is `on delete set null`**, and sessions go with their membership
  (`on delete cascade`), so deleting an account never fails on its history.
- **Deferred to Phase 4:** `time_entries_org_date` (for org-wide reports), `get_daily_totals()` and
  the Realtime broadcast trigger. The member pages read one person's range through
  `time_entries_member_date`.
- **Applying by hand:** the migrations can also be pasted into the SQL Editor as one script that
  records itself in `supabase_migrations.schema_migrations`, so a later `supabase db push` skips
  them.
