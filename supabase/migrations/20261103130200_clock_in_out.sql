-- clock_in() / clock_out(): the only way members create or close a session.
-- Times always come from now() (docs/business-rules.md §3); the work date is
-- the org-local date of the clock-in.
-- Design: docs/database.md §6, docs/architecture.md §6.4.
--
-- Errors (message, errcode): not_authenticated, not_a_member (42501),
-- invalid_input (22023), already_clocked_in, not_clocked_in,
-- session_overlap (P0001).

create function public.clock_in(
  p_org_id uuid,
  p_source public.entry_source default 'web'
)
returns public.time_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_timezone text;
  v_entry    public.time_entries;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  -- 'admin' and 'system' are for corrections and the auto-close job.
  if p_source is null or p_source not in ('web', 'mobile') then
    raise exception 'invalid_input' using errcode = '22023';
  end if;

  select o.timezone into v_timezone
  from public.organizations o
  join public.organization_members m on m.org_id = o.id
  where o.id = p_org_id
    and o.deleted_at is null
    and m.user_id = v_uid
    and m.status = 'active';

  if v_timezone is null then
    raise exception 'not_a_member' using errcode = '42501';
  end if;

  -- A forgotten session past its auto-close time closes first, as the job would.
  perform private.close_stale_entries(p_org_id, v_uid);

  insert into public.time_entries (org_id, user_id, work_date, clock_in_source)
  values (p_org_id, v_uid, (now() at time zone v_timezone)::date, p_source)
  returning * into v_entry;

  return v_entry;
exception
  -- An open session overlaps any new one, so the no-overlap constraint usually
  -- fires before time_entries_one_open; both mean "already clocked in" when an
  -- open session exists (also after a race with a second tab).
  when exclusion_violation or unique_violation then
    if exists (
      select 1
      from public.time_entries e
      where e.org_id = p_org_id and e.user_id = v_uid and e.clock_out_at is null
    ) then
      raise exception 'already_clocked_in' using errcode = 'P0001';
    end if;
    raise exception 'session_overlap' using errcode = 'P0001';
end;
$$;

-- Closes the caller's open session. If it was already past its auto-close time,
-- the auto-close rule sets the clock-out instead of the click (the returned
-- entry then has auto_closed = true); the note is kept either way.
create function public.clock_out(
  p_org_id uuid,
  p_note   text default null,
  p_source public.entry_source default 'web'
)
returns public.time_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_note    text := nullif(btrim(p_note), '');
  v_open_id uuid;
  v_entry   public.time_entries;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_source is null or p_source not in ('web', 'mobile') then
    raise exception 'invalid_input' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.organizations o
    join public.organization_members m on m.org_id = o.id
    where o.id = p_org_id
      and o.deleted_at is null
      and m.user_id = v_uid
      and m.status = 'active'
  ) then
    raise exception 'not_a_member' using errcode = '42501';
  end if;

  select e.id into v_open_id
  from public.time_entries e
  where e.org_id = p_org_id and e.user_id = v_uid and e.clock_out_at is null;

  if v_open_id is null then
    raise exception 'not_clocked_in' using errcode = 'P0001';
  end if;

  perform private.close_stale_entries(p_org_id, v_uid);

  -- coalesce keeps a clock-out the auto-close rule (or a racing job) already set.
  update public.time_entries e
  set clock_out_at     = coalesce(e.clock_out_at, now()),
      clock_out_source = coalesce(e.clock_out_source, p_source),
      note             = coalesce(v_note, e.note)
  where e.id = v_open_id
  returning * into v_entry;

  return v_entry;
exception
  when check_violation then
    raise exception 'invalid_input' using errcode = '22023';
end;
$$;

revoke execute on function public.clock_in(uuid, public.entry_source) from public, anon;
revoke execute on function public.clock_out(uuid, text, public.entry_source) from public, anon;
grant execute on function public.clock_in(uuid, public.entry_source) to authenticated;
grant execute on function public.clock_out(uuid, text, public.entry_source) to authenticated;
