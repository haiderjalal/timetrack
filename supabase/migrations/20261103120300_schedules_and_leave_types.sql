-- Versioned working hours and leave types.
-- Design: docs/database.md §4.5, §4.9, §5.2.

create table public.work_schedules (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations (id) on delete cascade,
  effective_from date not null,
  grace_minutes  smallint not null default 15 check (grace_minutes between 0 and 120),
  created_by     uuid not null references public.profiles (id),
  created_at     timestamptz not null default now(),
  unique (org_id, effective_from)
);

create index work_schedules_created_by on public.work_schedules (created_by);

create table public.work_schedule_days (
  schedule_id      uuid not null references public.work_schedules (id) on delete cascade,
  weekday          smallint not null check (weekday between 0 and 6),   -- 0 = Sunday
  is_working_day   boolean not null,
  start_time       time,
  end_time         time,                     -- end < start means the shift crosses midnight
  required_minutes smallint not null default 480 check (required_minutes between 0 and 1440),
  primary key (schedule_id, weekday),
  check (not is_working_day or (start_time is not null and end_time is not null))
);

create table public.leave_types (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations (id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 40),
  -- A design token name (docs/design-system.md §2.2), never a raw hex value.
  color_token       text not null default 'leave' check (color_token ~ '^[a-z][a-z-]{0,39}$'),
  is_paid           boolean not null default true,
  yearly_quota_days numeric(4, 1),           -- null = no limit
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (org_id, name),
  unique (org_id, id)                        -- target for leave_requests' composite FK
);

create trigger leave_types_set_updated_at
before update on public.leave_types
for each row execute function private.set_updated_at();

-- work_schedules + work_schedule_days -----------------------------------------
-- Versions are immutable: a change of hours is a new version (business-rules.md §8).

alter table public.work_schedules enable row level security;
alter table public.work_schedule_days enable row level security;

revoke all on table public.work_schedules from anon, authenticated;
revoke all on table public.work_schedule_days from anon, authenticated;
grant select on table public.work_schedules to authenticated;
grant insert (org_id, effective_from, grace_minutes, created_by) on table public.work_schedules to authenticated;
grant select, insert on table public.work_schedule_days to authenticated;
grant select, insert, update, delete on table public.work_schedules to service_role;
grant select, insert, update, delete on table public.work_schedule_days to service_role;

create policy work_schedules_select on public.work_schedules
for select to authenticated
using (org_id in (select private.member_org_ids()));

create policy work_schedules_insert on public.work_schedules
for insert to authenticated
with check (
  org_id in (select private.admin_org_ids())
  and created_by = (select auth.uid())
);

create policy work_schedule_days_select on public.work_schedule_days
for select to authenticated
using (
  schedule_id in (
    select s.id from public.work_schedules s
    where s.org_id in (select private.member_org_ids())
  )
);

create policy work_schedule_days_insert on public.work_schedule_days
for insert to authenticated
with check (
  schedule_id in (
    select s.id from public.work_schedules s
    where s.org_id in (select private.admin_org_ids())
  )
);

-- leave_types -----------------------------------------------------------------
-- No delete: types in use are deactivated instead (is_active = false).

alter table public.leave_types enable row level security;

revoke all on table public.leave_types from anon, authenticated;
grant select on table public.leave_types to authenticated;
grant insert (org_id, name, color_token, is_paid, yearly_quota_days, is_active)
  on table public.leave_types to authenticated;
grant update (name, color_token, is_paid, yearly_quota_days, is_active)
  on table public.leave_types to authenticated;
grant select, insert, update, delete on table public.leave_types to service_role;

create policy leave_types_select on public.leave_types
for select to authenticated
using (org_id in (select private.member_org_ids()));

create policy leave_types_insert on public.leave_types
for insert to authenticated
with check (org_id in (select private.admin_org_ids()));

create policy leave_types_update on public.leave_types
for update to authenticated
using (org_id in (select private.admin_org_ids()))
with check (org_id in (select private.admin_org_ids()));
