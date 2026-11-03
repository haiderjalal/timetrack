-- Tenant isolation and roles (docs/database.md §5.3): people in org A see none
-- of org B, members can't write what only admins may, and an org always keeps
-- an active owner.
begin;
create extension if not exists pgtap with schema extensions;
select plan(32);

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
grant execute on function tests.default_schedule() to authenticated;

-- Sign in as someone: role + JWT claims, as PostgREST does.
create function tests.sign_in(p_user uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true);
  select set_config('request.jwt.claims',
    jsonb_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
grant execute on function tests.sign_in(uuid) to authenticated;

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

-- Org ids, readable by every test user even where RLS hides the org itself.
create table tests.org_ids as select slug::text as slug, id from public.organizations;
grant select on tests.org_ids to authenticated;

-- Until invitations exist (Phase 2), add org A's admin and member directly.
insert into public.organization_members (org_id, user_id, role)
select o.id, u.user_id, u.role::public.member_role
from tests.org_ids o
cross join (values
  ('aaaaaaaa-0000-0000-0000-000000000002'::uuid, 'admin'),
  ('aaaaaaaa-0000-0000-0000-000000000003'::uuid, 'member')
) as u (user_id, role)
where o.slug = 'org-a';

-- Owner of org B sees nothing of org A ----------------------------------------

select tests.sign_in('bbbbbbbb-0000-0000-0000-000000000001');

select results_eq('select slug::text from public.organizations', $$ values ('org-b') $$,
  'B sees only org B');
select is((select count(*)::int from public.organization_members), 1,
  'B sees only org B''s membership');
select is((select count(*)::int from public.work_schedules), 1,
  'B sees only org B''s working hours');
select is((select count(*)::int from public.work_schedule_days), 7,
  'B sees only org B''s schedule days');
select is((select count(*)::int from public.leave_types), 4,
  'B sees only org B''s leave types');
select results_eq('select email::text from public.profiles', $$ values ('owner-b@example.com') $$,
  'B sees no one from org A');

select throws_ok(
  $$ insert into public.leave_types (org_id, name)
     select id, 'Sneaky' from tests.org_ids where slug = 'org-a' $$,
  '42501',
  null,
  'B cannot add leave types to org A'
);

with changed as (
  update public.organizations set name = 'Taken over'
  where id = (select id from tests.org_ids where slug = 'org-a')
  returning 1
)
select is(count(*)::int, 0, 'B cannot rename org A') from changed;

reset role;

-- Plain member of org A ---------------------------------------------------------

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000003');

select results_eq('select slug::text from public.organizations', $$ values ('org-a') $$,
  'a member sees their org');
select is((select count(*)::int from public.organization_members), 3,
  'a member sees everyone in their org');
select is((select count(*)::int from public.profiles), 3,
  'a member sees teammates'' profiles');
select is((select count(*)::int from public.work_schedule_days), 7,
  'a member sees their org''s working hours');

select throws_ok(
  $$ insert into public.organization_members (org_id, user_id, role)
     select id, 'aaaaaaaa-0000-0000-0000-000000000003', 'owner'
     from tests.org_ids where slug = 'org-a' $$,
  '42501',
  null,
  'members cannot add memberships directly'
);

select throws_ok(
  $$ update public.organization_members set role = 'owner'
     where user_id = 'aaaaaaaa-0000-0000-0000-000000000003' $$,
  '42501',
  null,
  'members cannot change roles directly'
);

select throws_ok(
  $$ insert into public.work_schedules (org_id, effective_from, grace_minutes, created_by)
     select id, current_date + 30, 5, 'aaaaaaaa-0000-0000-0000-000000000003'
     from tests.org_ids where slug = 'org-a' $$,
  '42501',
  null,
  'members cannot change working hours'
);

select throws_ok(
  $$ insert into public.leave_types (org_id, name)
     select id, 'Bonus' from tests.org_ids where slug = 'org-a' $$,
  '42501',
  null,
  'members cannot add leave types'
);

with changed as (
  update public.organizations set name = 'Renamed by member' returning 1
)
select is(count(*)::int, 0, 'members cannot rename the org') from changed;

with changed as (
  update public.leave_types set is_paid = false returning 1
)
select is(count(*)::int, 0, 'members cannot edit leave types') from changed;

select lives_ok(
  $$ update public.profiles
     set last_org_id = (select id from tests.org_ids where slug = 'org-a')
     where id = 'aaaaaaaa-0000-0000-0000-000000000003' $$,
  'members can remember their org as the last one used'
);

select throws_ok(
  $$ update public.profiles
     set last_org_id = (select id from tests.org_ids where slug = 'org-b')
     where id = 'aaaaaaaa-0000-0000-0000-000000000003' $$,
  '42501',
  null,
  'but not an org they are not in'
);

reset role;

-- Admin of org A ----------------------------------------------------------------

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000002');

select lives_ok(
  $$ insert into public.leave_types (org_id, name)
     select id, 'Comp off' from tests.org_ids where slug = 'org-a' $$,
  'admins can add leave types'
);

select lives_ok(
  $$ update public.organizations set name = 'Org A Ltd' $$,
  'admins can rename the org'
);

select lives_ok(
  $$ insert into public.work_schedules (org_id, effective_from, grace_minutes, created_by)
     select id, current_date + 30, 10, 'aaaaaaaa-0000-0000-0000-000000000002'
     from tests.org_ids where slug = 'org-a' $$,
  'admins can add a new working-hours version'
);

select throws_ok(
  $$ insert into public.work_schedules (org_id, effective_from, grace_minutes, created_by)
     select id, current_date + 60, 10, 'aaaaaaaa-0000-0000-0000-000000000001'
     from tests.org_ids where slug = 'org-a' $$,
  '42501',
  null,
  'admins cannot record a version as someone else'
);

reset role;

-- At least one active owner ---------------------------------------------------

select throws_ok(
  $$ update public.organization_members set role = 'admin'
     where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  'P0001',
  'last_owner',
  'the last owner cannot be demoted'
);

select throws_ok(
  $$ update public.organization_members set status = 'deactivated'
     where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  'P0001',
  'last_owner',
  'the last owner cannot be deactivated'
);

select throws_ok(
  $$ delete from public.organization_members
     where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  'P0001',
  'last_owner',
  'the last owner cannot be removed'
);

update public.organization_members set role = 'owner'
where user_id = 'aaaaaaaa-0000-0000-0000-000000000002';

select lives_ok(
  $$ update public.organization_members set role = 'admin'
     where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  'an owner can step down once there is another owner'
);

select lives_ok(
  $$ delete from public.organizations where slug = 'org-b' $$,
  'deleting a whole org is not blocked by its last owner'
);

-- Deactivated members lose access immediately ---------------------------------

update public.organization_members set status = 'deactivated'
where user_id = 'aaaaaaaa-0000-0000-0000-000000000003';

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000003');

select is((select count(*)::int from public.organizations), 0,
  'a deactivated member no longer sees the org');
select is((select count(*)::int from public.leave_types), 0,
  'or any of its data');

reset role;

-- Signed out --------------------------------------------------------------------

select set_config('role', 'anon', true);

select throws_ok('select 1 from public.organizations', '42501', null,
  'signed-out visitors cannot read organizations');

reset role;

select * from finish();
rollback;
