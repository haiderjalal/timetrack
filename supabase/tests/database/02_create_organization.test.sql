-- create_organization(): one transaction creates the org, the owner membership,
-- the first working hours, the default leave types and remembers the org.
begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

-- Test helpers, rolled back with everything else.
create schema if not exists tests;
grant usage on schema tests to authenticated;

-- Mon–Fri 09:00–18:00, 8h, 15 min grace (business-rules.md §8).
create function tests.default_schedule() returns jsonb language sql as $$
  select jsonb_build_object(
    'grace_minutes', 15,
    'days', (
      select jsonb_agg(jsonb_build_object(
        'weekday', d,
        'is_working_day', d between 1 and 5,
        'start_time', case when d between 1 and 5 then '09:00' end,
        'end_time', case when d between 1 and 5 then '18:00' end,
        'required_minutes', case when d between 1 and 5 then 480 else 0 end
      ) order by d)
      from generate_series(0, 6) as d
    )
  )
$$;
grant execute on function tests.default_schedule() to authenticated;

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com', '{"full_name": "Owner"}'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com', '{"full_name": "Other"}');

-- Signed out
select set_config('role', 'anon', true);

select throws_ok(
  $$ select public.create_organization('Acme', 'acme', 'Asia/Karachi', tests.default_schedule()) $$,
  '42501',
  null,
  'signed-out visitors cannot create an organization'
);

-- Signed in as the owner
reset role;
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);

select is(
  (select slug::text from public.create_organization(
     '  Acme Inc  ', 'acme', 'Asia/Karachi', tests.default_schedule())),
  'acme',
  'returns the new organization'
);

select results_eq(
  'select name, timezone, week_starts_on from public.organizations',
  $$ values ('Acme Inc', 'Asia/Karachi', 1::smallint) $$,
  'the org is saved with a trimmed name and the chosen timezone'
);

select results_eq(
  $$ select user_id, role::text, status::text from public.organization_members $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid, 'owner', 'active') $$,
  'the creator becomes its active owner'
);

select results_eq(
  'select effective_from, grace_minutes from public.work_schedules',
  $$ values ((now() at time zone 'Asia/Karachi')::date, 15::smallint) $$,
  'the first working hours start today in the org timezone'
);

select results_eq(
  $$ select weekday, is_working_day, start_time, end_time, required_minutes
     from public.work_schedule_days order by weekday $$,
  $$ values
       (0::smallint, false, null::time, null::time, 0::smallint),
       (1::smallint, true, '09:00'::time, '18:00'::time, 480::smallint),
       (2::smallint, true, '09:00'::time, '18:00'::time, 480::smallint),
       (3::smallint, true, '09:00'::time, '18:00'::time, 480::smallint),
       (4::smallint, true, '09:00'::time, '18:00'::time, 480::smallint),
       (5::smallint, true, '09:00'::time, '18:00'::time, 480::smallint),
       (6::smallint, false, null::time, null::time, 0::smallint) $$,
  'all seven days are saved'
);

select results_eq(
  'select name, is_paid from public.leave_types order by name',
  $$ values ('Annual', true), ('Casual', true), ('Sick', true), ('Unpaid', false) $$,
  'the default leave types are created'
);

select is(
  (select o.slug::text from public.profiles p join public.organizations o on o.id = p.last_org_id),
  'acme',
  'the new org becomes the one to land in after sign-in'
);

select throws_ok(
  $$ select public.create_organization('Acme Two', 'ACME', 'Asia/Karachi', tests.default_schedule()) $$,
  'P0001',
  'slug_taken',
  'URL slugs are unique, ignoring case'
);

select lives_ok(
  $$ select public.create_organization('Second Org', 'second-org', 'Europe/London', tests.default_schedule()) $$,
  'one person can create several orgs'
);

select is(
  (select count(*)::int from public.organization_members),
  2,
  'and owns each of them'
);

select throws_ok(
  $$ select public.create_organization('Acme', 'acme-tz', 'Mars/Olympus', tests.default_schedule()) $$,
  '22023',
  'invalid_timezone',
  'the timezone must be a real IANA zone'
);

select throws_ok(
  $$ select public.create_organization('Acme', 'Bad_Slug', 'Asia/Karachi', tests.default_schedule()) $$,
  '22023',
  'invalid_input',
  'slugs only use lowercase letters, numbers and hyphens'
);

select throws_ok(
  $$ select public.create_organization('A', 'acme-short', 'Asia/Karachi', tests.default_schedule()) $$,
  '22023',
  'invalid_input',
  'names need at least two characters'
);

select throws_ok(
  $$ select public.create_organization('Acme', 'acme-six', 'Asia/Karachi',
       jsonb_set(tests.default_schedule(), '{days}', (tests.default_schedule() -> 'days') - 6)) $$,
  '22023',
  'invalid_schedule',
  'the schedule must have all seven days'
);

select throws_ok(
  $$ select public.create_organization('Acme', 'acme-dup', 'Asia/Karachi',
       jsonb_set(tests.default_schedule(), '{days,6,weekday}', '1')) $$,
  '22023',
  'invalid_schedule',
  'each weekday appears once'
);

select throws_ok(
  $$ select public.create_organization('Acme', 'acme-times', 'Asia/Karachi',
       jsonb_set(tests.default_schedule(), '{days,1,start_time}', 'null')) $$,
  '22023',
  'invalid_input',
  'a working day needs a start and end time'
);

select throws_ok(
  $$ select public.create_organization('Acme', 'acme-grace', 'Asia/Karachi',
       jsonb_set(tests.default_schedule(), '{grace_minutes}', '500')) $$,
  '22023',
  'invalid_input',
  'grace is at most 120 minutes'
);

-- Another person
select set_config('request.jwt.claims',
  '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', true);

select is(
  (select count(*)::int from public.organizations),
  0,
  'other people cannot see the new orgs'
);

select * from finish();
rollback;
