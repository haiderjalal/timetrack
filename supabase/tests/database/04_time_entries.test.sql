-- Clock in / out, forgotten clock-outs and who can see or change sessions
-- (docs/business-rules.md §3, §6; docs/database.md §4.7, §5.2).
begin;
create extension if not exists pgtap with schema extensions;
select plan(41);

create schema if not exists tests;
grant usage on schema tests to authenticated;

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

create function tests.sign_in(p_user uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true);
  select set_config('request.jwt.claims',
    jsonb_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;

-- A wall-clock time in a zone, as an instant.
create function tests.at(p_date date, p_time time, p_zone text) returns timestamptz
language sql stable as $$ select (p_date + p_time) at time zone p_zone $$;

-- Monday of last week in Karachi: always in the past, always a working day.
create function tests.last_monday() returns date language sql stable as $$
  select (now() at time zone 'Asia/Karachi')::date - 7
    - (extract(isodow from (now() at time zone 'Asia/Karachi')::date)::int - 1)
$$;

create function tests.karachi(p_offset_days int, p_time time) returns timestamptz
language sql stable as $$
  select tests.at(tests.last_monday() + p_offset_days, p_time, 'Asia/Karachi')
$$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'owner-a@example.com', '{"full_name": "Owner A"}'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'admin-a@example.com', '{"full_name": "Admin A"}'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'member-a@example.com', '{"full_name": "Member A"}'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'owner-b@example.com', '{"full_name": "Owner B"}');

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000001');
select public.create_organization('Org A', 'org-a', 'Asia/Karachi', tests.default_schedule());
reset role;
select tests.sign_in('bbbbbbbb-0000-0000-0000-000000000001');
select public.create_organization('Org B', 'org-b', 'Europe/London', tests.default_schedule());
reset role;

create table tests.org_ids as select slug::text as slug, id from public.organizations;
grant select on tests.org_ids to authenticated;

create function tests.org(p_slug text) returns uuid language sql stable as $$
  select id from tests.org_ids where slug = p_slug
$$;
grant execute on all functions in schema tests to authenticated;

insert into public.organization_members (org_id, user_id, role)
select tests.org('org-a'), u.user_id, u.role::public.member_role
from (values
  ('aaaaaaaa-0000-0000-0000-000000000002'::uuid, 'admin'),
  ('aaaaaaaa-0000-0000-0000-000000000003'::uuid, 'member')
) as u (user_id, role);

-- Org A's hours (Mon–Fri 09:00–18:00) apply to the past dates used below.
update public.work_schedules set effective_from = date '2020-01-01'
where org_id = tests.org('org-a');

-- Org B: everything off from 2020, then a Monday night shift (22:00–06:00) from June 2020.
with versions as (
  insert into public.work_schedules (org_id, effective_from, grace_minutes, created_by)
  values
    (tests.org('org-b'), date '2020-01-01', 15, 'bbbbbbbb-0000-0000-0000-000000000001'),
    (tests.org('org-b'), date '2020-06-01', 15, 'bbbbbbbb-0000-0000-0000-000000000001')
  returning id, effective_from
)
insert into public.work_schedule_days
  (schedule_id, weekday, is_working_day, start_time, end_time, required_minutes)
select v.id, d,
  v.effective_from = date '2020-06-01' and d = 1,
  case when v.effective_from = date '2020-06-01' and d = 1 then time '22:00' end,
  case when v.effective_from = date '2020-06-01' and d = 1 then time '06:00' end,
  case when v.effective_from = date '2020-06-01' and d = 1 then 480 else 0 end
from versions v cross join generate_series(0, 6) as d;

-- When does a forgotten session close? -------------------------------------------

select is(
  (select row(close_after, close_at)::text from private.auto_close_plan(
    tests.org('org-a'), tests.last_monday(), tests.karachi(0, '09:00'), 'Asia/Karachi')),
  row(tests.karachi(0, '22:00'), tests.karachi(0, '18:00'))::text,
  'working day: closes at shift end + 4h, clocked out at shift end'
);

select is(
  (select close_at from private.auto_close_plan(
    tests.org('org-a'), tests.last_monday(), tests.karachi(0, '07:00'), 'Asia/Karachi')),
  tests.karachi(0, '18:00'),
  'a clock-in before the shift starts still runs to shift end'
);

select is(
  (select row(close_after, close_at)::text from private.auto_close_plan(
    tests.org('org-a'), tests.last_monday() + 1, tests.karachi(1, '19:00'), 'Asia/Karachi')),
  row(tests.karachi(2, '07:00'), tests.karachi(1, '19:00'))::text,
  'after shift end: closes 12h later with no time credited'
);

select is(
  (select row(close_after, close_at)::text from private.auto_close_plan(
    tests.org('org-a'), tests.last_monday() + 5, tests.karachi(5, '10:00'), 'Asia/Karachi')),
  row(tests.karachi(5, '22:00'), tests.karachi(5, '10:00'))::text,
  'day off: closes 12h later with no time credited'
);

select is(
  (select row(close_after, close_at)::text from private.auto_close_plan(
    tests.org('org-b'), tests.last_monday(),
    tests.at(tests.last_monday(), '21:50', 'Europe/London'), 'Europe/London')),
  row(
    tests.at(tests.last_monday() + 1, '10:00', 'Europe/London'),
    tests.at(tests.last_monday() + 1, '06:00', 'Europe/London')
  )::text,
  'a night shift ends the next morning'
);

select is(
  (select row(close_after, close_at)::text from private.auto_close_plan(
    tests.org('org-b'), tests.last_monday(),
    tests.at(tests.last_monday(), '00:30', 'Europe/London'), 'Europe/London')),
  row(
    tests.at(tests.last_monday(), '00:30', 'Europe/London') + interval '24 hours',
    tests.at(tests.last_monday(), '00:30', 'Europe/London') + interval '24 hours'
  )::text,
  'no session runs past 24h'
);

select is(
  (select close_at from private.auto_close_plan(
    tests.org('org-b'), date '2020-03-02', tests.at(date '2020-03-02', '23:00', 'Europe/London'),
    'Europe/London')),
  tests.at(date '2020-03-02', '23:00', 'Europe/London'),
  'the working-hours version in effect on that date decides (a Monday off in March 2020)'
);

-- Forgotten sessions get closed ---------------------------------------------------

insert into public.time_entries (org_id, user_id, work_date, clock_in_at) values
  (tests.org('org-a'), 'aaaaaaaa-0000-0000-0000-000000000003', tests.last_monday(), tests.karachi(0, '09:00')),
  (tests.org('org-a'), 'aaaaaaaa-0000-0000-0000-000000000002', tests.last_monday() + 5, tests.karachi(5, '10:00')),
  (tests.org('org-a'), 'aaaaaaaa-0000-0000-0000-000000000001', tests.last_monday() + 1, tests.karachi(1, '19:00')),
  (tests.org('org-b'), 'bbbbbbbb-0000-0000-0000-000000000001',
    (now() at time zone 'Europe/London')::date, now() - interval '1 hour');

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000003');
select results_eq(
  $$ select clock_out_at, auto_closed, note, clock_out_source::text
     from public.clock_out(tests.org('org-a'), '  Forgot to clock out  ') $$,
  $$ values (tests.karachi(0, '18:00'), true, 'Forgot to clock out'::text, 'system'::text) $$,
  'clocking out a stale session applies the rule, not the click, and keeps the note'
);
reset role;

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000002');
select results_eq(
  $$ select clock_out_at is null, work_date = (now() at time zone 'Asia/Karachi')::date
     from public.clock_in(tests.org('org-a')) $$,
  $$ values (true, true) $$,
  'clocking in with a stale session open starts a new one'
);
select is(
  (select clock_out_at = clock_in_at and auto_closed from public.time_entries
   where user_id = 'aaaaaaaa-0000-0000-0000-000000000002' and work_date = tests.last_monday() + 5),
  true,
  'and the stale Saturday session was closed with no time credited'
);
reset role;

select is(private.close_stale_entries(), 1, 'the job closes the one stale session left');
select is(
  (select clock_out_at from public.time_entries
   where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  tests.karachi(1, '19:00'),
  'an after-hours session closes at its own clock-in'
);
select is(
  (select count(*)::int from public.time_entries
   where user_id = 'bbbbbbbb-0000-0000-0000-000000000001' and clock_out_at is null),
  1,
  'a session younger than 4h stays open'
);
select is(private.close_stale_entries(), 0, 'running the job again changes nothing');
select results_eq(
  $$ select count(*)::int, (count(*) filter (
       where actor_id is null and action = 'time_entry.auto_closed' and entity_type = 'time_entry'
     ))::int
     from public.audit_log $$,
  $$ values (3, 3) $$,
  'every automatic close is in the audit log, by the system'
);

-- Clocking in and out ---------------------------------------------------------------

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000003');

select results_eq(
  $$ select user_id, clock_in_at = now(), work_date, clock_in_source::text, clock_out_at
     from public.clock_in(tests.org('org-a')) $$,
  $$ values ('aaaaaaaa-0000-0000-0000-000000000003'::uuid, true,
             (now() at time zone 'Asia/Karachi')::date, 'web'::text, null::timestamptz) $$,
  'clock_in records the server time and the org-local date'
);
select throws_ok(
  $$ select public.clock_in(tests.org('org-a')) $$,
  'P0001', 'already_clocked_in',
  'a second clock-in is rejected'
);
select throws_ok(
  $$ select public.clock_in(tests.org('org-a'), 'admin') $$,
  '22023', 'invalid_input',
  'members cannot claim an admin or system source'
);
select throws_ok(
  $$ select public.clock_out(tests.org('org-a'), repeat('x', 501)) $$,
  '22023', 'invalid_input',
  'notes are limited to 500 characters'
);
select results_eq(
  $$ select clock_out_at = now(), note, auto_closed from public.clock_out(tests.org('org-a'), '   ') $$,
  $$ values (true, null::text, false) $$,
  'clock_out records the server time; a blank note is dropped'
);
select throws_ok(
  $$ select public.clock_out(tests.org('org-a')) $$,
  'P0001', 'not_clocked_in',
  'clocking out twice is rejected'
);
reset role;

select tests.sign_in('bbbbbbbb-0000-0000-0000-000000000001');
select throws_ok(
  $$ select public.clock_in(tests.org('org-a')) $$,
  '42501', 'not_a_member',
  'nobody can clock in to an org they are not in'
);
reset role;

select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims', '', true);
select throws_ok(
  $$ select public.clock_in(tests.org('org-a')) $$,
  '42501', 'not_authenticated',
  'clock_in needs a signed-in user'
);
reset role;

-- Who sees and changes sessions ------------------------------------------------------

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000003');
select results_eq(
  'select user_id, count(*)::int from public.time_entries group by user_id',
  $$ values ('aaaaaaaa-0000-0000-0000-000000000003'::uuid, 2) $$,
  'a member sees only their own sessions'
);
select is((select count(*)::int from public.audit_log), 0, 'a member cannot read the audit log');
select throws_ok(
  $$ insert into public.time_entries (org_id, user_id, work_date)
     values (tests.org('org-a'), 'aaaaaaaa-0000-0000-0000-000000000003', current_date) $$,
  '42501', null,
  'members cannot insert sessions directly'
);
select throws_ok(
  $$ update public.time_entries set clock_in_at = clock_in_at - interval '1 hour' $$,
  '42501', null,
  'members cannot edit their times'
);
select throws_ok(
  $$ delete from public.time_entries $$,
  '42501', null,
  'members cannot delete sessions'
);
reset role;

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000002');
select is((select count(*)::int from public.time_entries), 5,
  'an admin sees every session in their org, and none elsewhere');
select is((select count(*)::int from public.audit_log), 3, 'an admin reads their org''s audit log');
select throws_ok(
  $$ update public.time_entries set note = 'edited' $$,
  '42501', null,
  'admins cannot edit sessions directly either (corrections go through an audited function)'
);
select throws_ok(
  $$ insert into public.audit_log (org_id, action, entity_type)
     values (tests.org('org-a'), 'time_entry.adjusted', 'time_entry') $$,
  '42501', null,
  'nobody writes the audit log directly'
);
reset role;

select tests.sign_in('bbbbbbbb-0000-0000-0000-000000000001');
select is((select count(*)::int from public.time_entries), 1, 'owner B sees only org B''s sessions');
select is((select count(*)::int from public.audit_log), 0, 'owner B sees none of org A''s audit log');
reset role;

update public.organization_members set status = 'deactivated'
where user_id = 'aaaaaaaa-0000-0000-0000-000000000003';

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000003');
select throws_ok(
  $$ select public.clock_in(tests.org('org-a')) $$,
  '42501', 'not_a_member',
  'a deactivated member cannot clock in'
);
select is((select count(*)::int from public.time_entries), 0,
  'and no longer sees their sessions');
reset role;

set local role anon;
select throws_ok('select 1 from public.time_entries', '42501', null, 'anon cannot read sessions');
reset role;

-- The database keeps sessions consistent -----------------------------------------------

select throws_ok(
  $$ insert into public.time_entries (org_id, user_id, work_date, clock_in_at, clock_out_at, clock_out_source)
     values (tests.org('org-a'), 'aaaaaaaa-0000-0000-0000-000000000003', tests.last_monday(),
             tests.karachi(0, '10:00'), tests.karachi(0, '11:00'), 'admin') $$,
  '23P01', null,
  'sessions of one person cannot overlap'
);
select throws_ok(
  $$ insert into public.time_entries (org_id, user_id, work_date, clock_in_at, clock_out_at, clock_out_source)
     values (tests.org('org-a'), 'aaaaaaaa-0000-0000-0000-000000000003', tests.last_monday() - 7,
             tests.karachi(-7, '09:00'), tests.karachi(-7, '09:00') + interval '25 hours', 'admin') $$,
  '23514', null,
  'a session lasts at most 24 hours'
);
select throws_ok(
  $$ insert into public.time_entries (org_id, user_id, work_date)
     values (tests.org('org-a'), 'bbbbbbbb-0000-0000-0000-000000000001', current_date) $$,
  '23503', null,
  'only members of the org can have sessions in it'
);
select lives_ok(
  $$ insert into public.time_entries (org_id, user_id, work_date, clock_in_at, clock_out_at, clock_out_source)
     values
       (tests.org('org-a'), 'aaaaaaaa-0000-0000-0000-000000000003', tests.last_monday() - 7,
        tests.karachi(-7, '09:00'), tests.karachi(-7, '13:00'), 'admin'),
       (tests.org('org-a'), 'aaaaaaaa-0000-0000-0000-000000000003', tests.last_monday() - 7,
        tests.karachi(-7, '13:00'), tests.karachi(-7, '18:00'), 'admin') $$,
  'back-to-back sessions are fine'
);

select * from finish();
rollback;
