-- audit_log: append-only record of admin changes to people and their hours.
-- Design: docs/database.md §4.8. Rows are written only by RPCs and triggers.

create table public.audit_log (
  id           bigint generated always as identity primary key,
  org_id       uuid not null references public.organizations (id) on delete cascade,
  actor_id     uuid references public.profiles (id) on delete set null,   -- null = system
  action       text not null check (char_length(action) between 1 and 80),  -- e.g. 'member.role_changed'
  entity_type  text not null check (char_length(entity_type) between 1 and 40),
  entity_id    uuid,
  before       jsonb,
  after        jsonb,
  reason       text check (char_length(reason) <= 500),
  created_at   timestamptz not null default now()
);

create index audit_log_org_created on public.audit_log (org_id, created_at desc);
create index audit_log_actor_id on public.audit_log (actor_id);

alter table public.audit_log enable row level security;

-- Nobody updates or deletes rows, and signed-in users don't insert them either:
-- the table only grows through the security definer functions.
revoke all on table public.audit_log from anon, authenticated;
grant select on table public.audit_log to authenticated;
grant select, insert on table public.audit_log to service_role;

create policy audit_log_select on public.audit_log
for select to authenticated
using (org_id in (select private.admin_org_ids()));
