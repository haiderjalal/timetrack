-- Forgotten clock-outs (docs/business-rules.md §6, confirmed 2026-11-03).
--
-- | Situation                                       | Closes when        | Clock-out set to |
-- | Working day, clocked in before shift end        | shift end + 4h     | shift end        |
-- | Clocked in after shift end, day off, no hours   | clock-in + 12h     | clock-in (0h)    |
--
-- A session lasts at most 24h (§3.5), so both are capped at clock-in + 24h:
-- a clock-in at 00:30 for a 22:00–06:00 shift would otherwise run 33h.
-- Holidays arrive in Phase 4 and will take the second row.
--
-- The pg_cron job runs every 15 minutes. clock_in / clock_out also close the
-- caller's own stale session first, so a missed run never blocks anyone.

-- When an open session becomes stale and the clock-out it gets.
create function private.auto_close_plan(
  p_org_id      uuid,
  p_work_date   date,
  p_clock_in_at timestamptz,
  p_timezone    text,
  out close_after timestamptz,
  out close_at    timestamptz
)
language sql
stable
set search_path = ''
as $$
  with version as (
    select s.id
    from public.work_schedules s
    where s.org_id = p_org_id and s.effective_from <= p_work_date
    order by s.effective_from desc
    limit 1
  ),
  shift as (
    -- end_time <= start_time: the shift ends the next day (work_schedule_days).
    select (
      p_work_date + d.end_time
      + case when d.end_time <= d.start_time then interval '1 day' else interval '0 days' end
    ) at time zone p_timezone as shift_end
    from version v
    join public.work_schedule_days d on d.schedule_id = v.id
    where d.weekday = extract(dow from p_work_date) and d.is_working_day
  ),
  rule as (
    select
      case when shift.shift_end > p_clock_in_at
        then shift.shift_end + interval '4 hours'
        else p_clock_in_at + interval '12 hours'
      end as close_after,
      case when shift.shift_end > p_clock_in_at
        then shift.shift_end
        else p_clock_in_at
      end as close_at
    from (select) as one
    left join shift on true
  )
  select
    least(rule.close_after, p_clock_in_at + interval '24 hours'),
    least(rule.close_at, p_clock_in_at + interval '24 hours')
  from rule
$$;

-- Closes every stale session (or only one org's / one person's) and writes an
-- audit entry for each. Returns how many it closed.
create function private.close_stale_entries(
  p_org_id  uuid default null,
  p_user_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_closed integer;
begin
  with due as (
    select e.id, plan.close_at
    from public.time_entries e
    join public.organizations o on o.id = e.org_id
    cross join lateral private.auto_close_plan(
      e.org_id, e.work_date, e.clock_in_at, o.timezone
    ) as plan
    where e.clock_out_at is null
      -- Every rule waits at least 4h after clock-in, so only older sessions qualify.
      and e.clock_in_at <= now() - interval '4 hours'
      and (p_org_id is null or e.org_id = p_org_id)
      and (p_user_id is null or e.user_id = p_user_id)
      and plan.close_after <= now()
  ),
  closed as (
    update public.time_entries e
    set clock_out_at     = due.close_at,
        clock_out_source = 'system',
        auto_closed      = true
    from due
    where e.id = due.id
      and e.clock_out_at is null  -- re-checked if the person clocked out meanwhile
    returning e.id, e.org_id, e.clock_out_at
  )
  insert into public.audit_log (org_id, actor_id, action, entity_type, entity_id, before, after)
  select
    closed.org_id, null, 'time_entry.auto_closed', 'time_entry', closed.id,
    jsonb_build_object('clock_out_at', null, 'auto_closed', false),
    jsonb_build_object('clock_out_at', closed.clock_out_at, 'auto_closed', true)
  from closed;

  get diagnostics v_closed = row_count;
  return v_closed;
end;
$$;

revoke execute on function private.auto_close_plan(uuid, date, timestamptz, text) from public, anon, authenticated;
revoke execute on function private.close_stale_entries(uuid, uuid) from public, anon, authenticated;

-- Every 15 minutes. pg_cron is on every Supabase project; a plain Postgres
-- (tests) skips the schedule and relies on clock_in / clock_out alone.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule(
      'auto-close-stale-entries',
      '*/15 * * * *',
      'select private.close_stale_entries()'
    );
  else
    raise notice 'pg_cron is not available: stale sessions close on the next clock-in or clock-out.';
  end if;
end;
$$;
