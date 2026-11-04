-- create_organization(): the only way to create an org.
-- Design: docs/database.md §6, docs/architecture.md §6.2.
--
-- One transaction: the org, the caller's owner membership, the first working-
-- hours version (effective from the org-local today), the default leave types,
-- and the caller's last_org_id so sign-in lands here next time.
--
-- p_schedule: {
--   "grace_minutes": 15,
--   "days": [ { "weekday": 0..6, "is_working_day": bool,
--               "start_time": "09:00" | null, "end_time": "18:00" | null,
--               "required_minutes": 0..1440 }, ... exactly 7, one per weekday ]
-- }
--
-- Errors (message, errcode): not_authenticated (42501), invalid_schedule,
-- invalid_input, invalid_timezone (22023), slug_taken (P0001).

create function public.create_organization(
  p_name     text,
  p_slug     text,
  p_timezone text,
  p_schedule jsonb
)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid         uuid := (select auth.uid());
  v_days        jsonb := p_schedule -> 'days';
  v_org         public.organizations;
  v_schedule_id uuid;
  v_constraint  text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if jsonb_typeof(v_days) is distinct from 'array'
     or jsonb_array_length(v_days) <> 7
     or (
       select count(distinct d.value ->> 'weekday')
       from jsonb_array_elements(v_days) as d
       where d.value ->> 'weekday' in ('0', '1', '2', '3', '4', '5', '6')
     ) <> 7
  then
    raise exception 'invalid_schedule' using errcode = '22023';
  end if;

  insert into public.organizations (name, slug, timezone, created_by)
  values (btrim(p_name), lower(btrim(p_slug)), p_timezone, v_uid)
  returning * into v_org;

  insert into public.organization_members (org_id, user_id, role)
  values (v_org.id, v_uid, 'owner');

  insert into public.work_schedules (org_id, effective_from, grace_minutes, created_by)
  values (
    v_org.id,
    (now() at time zone v_org.timezone)::date,
    (p_schedule ->> 'grace_minutes')::smallint,
    v_uid
  )
  returning id into v_schedule_id;

  insert into public.work_schedule_days
    (schedule_id, weekday, is_working_day, start_time, end_time, required_minutes)
  select v_schedule_id, d.weekday, d.is_working_day, d.start_time, d.end_time, d.required_minutes
  from jsonb_to_recordset(v_days) as d (
    weekday          smallint,
    is_working_day   boolean,
    start_time       time,
    end_time         time,
    required_minutes smallint
  );

  insert into public.leave_types (org_id, name, is_paid)
  values
    (v_org.id, 'Casual', true),
    (v_org.id, 'Sick', true),
    (v_org.id, 'Annual', true),
    (v_org.id, 'Unpaid', false);

  update public.profiles set last_org_id = v_org.id where id = v_uid;

  return v_org;
exception
  when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'organizations_slug_key' then
      raise exception 'slug_taken' using errcode = 'P0001';
    end if;
    raise;
  when check_violation
    or not_null_violation
    or invalid_text_representation
    or invalid_datetime_format
    or datetime_field_overflow
    or numeric_value_out_of_range
  then
    raise exception 'invalid_input' using errcode = '22023';
end;
$$;

revoke execute on function public.create_organization(text, text, text, jsonb) from public, anon;
grant execute on function public.create_organization(text, text, text, jsonb) to authenticated;
