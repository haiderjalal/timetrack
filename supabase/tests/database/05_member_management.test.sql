-- Member management (docs/database.md §6, docs/business-rules.md §1): owners set
-- admin and member roles, admins deactivate members, deactivated people lose
-- access at once, re-invited people come back, every change is audited, and an
-- org always keeps an active owner.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

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

create function tests.hash(p_token text) returns text language sql as $$
  select encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
$$;
grant execute on function tests.hash(text) to authenticated;

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'owner-a@example.com', '{"full_name": "Owner A"}'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'admin-a@example.com', '{"full_name": "Admin A"}'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'member-a@example.com', '{"full_name": "Member A"}'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'member-b@example.com', '{"full_name": "Member B"}'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'member-c@example.com', '{"full_name": "Member C"}'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'owner-b@example.com', '{"full_name": "Owner B"}');

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000001');
select public.create_organization('Org A', 'org-a', 'Asia/Karachi', tests.default_schedule());
reset role;
select tests.sign_in('bbbbbbbb-0000-0000-0000-000000000001');
select public.create_organization('Org B', 'org-b', 'Europe/London', tests.default_schedule());
reset role;

create table tests.org_ids as select slug::text as slug, id from public.organizations;
grant select on tests.org_ids to authenticated;

-- Fixtures: the people below join org A directly; invitations are tested elsewhere.
insert into public.organization_members (org_id, user_id, role)
select o.id, u.user_id, u.role::public.member_role
from tests.org_ids o
cross join (values
  ('aaaaaaaa-0000-0000-0000-000000000002'::uuid, 'admin'),
  ('aaaaaaaa-0000-0000-0000-000000000003'::uuid, 'member'),
  ('aaaaaaaa-0000-0000-0000-000000000004'::uuid, 'member'),
  ('aaaaaaaa-0000-0000-0000-000000000005'::uuid, 'member')
) as u (user_id, role)
where o.slug = 'org-a';

-- Roles --------------------------------------------------------------------------

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000002');

select throws_ok(
  $$ select public.change_member_role(
       (select id from tests.org_ids where slug = 'org-a'),
       'aaaaaaaa-0000-0000-0000-000000000004', 'admin') $$,
  '42501', 'not_allowed',
  'an admin cannot change roles'
);

reset role;
select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000003');

select throws_ok(
  $$ select public.change_member_role(
       (select id from tests.org_ids where slug = 'org-a'),
       'aaaaaaaa-0000-0000-0000-000000000004', 'admin') $$,
  '42501', 'not_allowed',
  'a member cannot change roles'
);

reset role;
select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000001');

select throws_ok(
  $$ select public.change_member_role(
       (select id from tests.org_ids where slug = 'org-a'),
       'aaaaaaaa-0000-0000-0000-000000000004', 'owner') $$,
  '22023', 'invalid_role',
  'nobody can be made an owner'
);

select throws_ok(
  $$ select public.change_member_role(
       (select id from tests.org_ids where slug = 'org-a'),
       'aaaaaaaa-0000-0000-0000-000000000001', 'member') $$,
  '42501', 'not_allowed',
  'an owner''s role does not change here'
);

select is(
  (select role::text from public.change_member_role(
     (select id from tests.org_ids where slug = 'org-a'),
     'aaaaaaaa-0000-0000-0000-000000000004', 'admin')),
  'admin', 'an owner promotes a member to admin'
);

select is(
  (select role::text from public.change_member_role(
     (select id from tests.org_ids where slug = 'org-a'),
     'aaaaaaaa-0000-0000-0000-000000000004', 'member')),
  'member', 'an owner demotes an admin back to member'
);

reset role;
select tests.sign_in('bbbbbbbb-0000-0000-0000-000000000001');

select throws_ok(
  $$ select public.change_member_role(
       (select id from tests.org_ids where slug = 'org-a'),
       'aaaaaaaa-0000-0000-0000-000000000004', 'admin') $$,
  '42501', 'not_allowed',
  'owner B cannot change roles in org A'
);

-- Deactivating -------------------------------------------------------------------

reset role;
select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000002');

select throws_ok(
  $$ select public.deactivate_member(
       (select id from tests.org_ids where slug = 'org-a'),
       'aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', 'not_allowed',
  'an admin cannot deactivate an owner'
);

select throws_ok(
  $$ select public.deactivate_member(
       (select id from tests.org_ids where slug = 'org-a'),
       'aaaaaaaa-0000-0000-0000-000000000002') $$,
  'P0001', 'cannot_deactivate_self',
  'nobody deactivates themselves'
);

select is(
  (select status::text from public.deactivate_member(
     (select id from tests.org_ids where slug = 'org-a'),
     'aaaaaaaa-0000-0000-0000-000000000005')),
  'deactivated', 'an admin deactivates a member'
);

select throws_ok(
  $$ select public.deactivate_member(
       (select id from tests.org_ids where slug = 'org-a'),
       'aaaaaaaa-0000-0000-0000-000000000005') $$,
  'P0002', 'member_not_found',
  'a deactivated member cannot be deactivated again'
);

reset role;
select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000003');

select throws_ok(
  $$ select public.deactivate_member(
       (select id from tests.org_ids where slug = 'org-a'),
       'aaaaaaaa-0000-0000-0000-000000000004') $$,
  '42501', 'not_allowed',
  'a member cannot deactivate anyone'
);

reset role;
select tests.sign_in('bbbbbbbb-0000-0000-0000-000000000001');

select throws_ok(
  $$ select public.deactivate_member(
       (select id from tests.org_ids where slug = 'org-a'),
       'aaaaaaaa-0000-0000-0000-000000000003') $$,
  '42501', 'not_allowed',
  'owner B cannot deactivate people in org A'
);

-- Re-inviting a deactivated member -------------------------------------------------

reset role;
select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000001');

select lives_ok(
  $$ select public.create_invitation(
       (select id from tests.org_ids where slug = 'org-a'),
       'member-c@example.com', 'admin', tests.hash('token-back')) $$,
  'an owner re-invites a deactivated member as admin'
);

reset role;
select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000005');

select is(
  (select invitation_state from public.preview_invitation('token-back')),
  'ready', 'the re-invited member can open the invitation'
);

select is(
  (select slug::text from public.accept_invitation('token-back')),
  'org-a', 'the re-invited member accepts'
);

select results_eq(
  $$ select role::text, status::text from public.organization_members
     where user_id = 'aaaaaaaa-0000-0000-0000-000000000005' $$,
  $$ values ('admin'::text, 'active'::text) $$,
  'the membership comes back active, with the new role'
);

-- Owner deactivations and access -----------------------------------------------------

reset role;
select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000001');

select is(
  (select status::text from public.deactivate_member(
     (select id from tests.org_ids where slug = 'org-a'),
     'aaaaaaaa-0000-0000-0000-000000000004')),
  'deactivated', 'an owner deactivates a member'
);

reset role;
select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000004');

select is(
  (select count(*)::int from public.organizations),
  0, 'a deactivated member loses access to the org'
);

reset role;
select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000003');

select is(
  (select count(*)::int from public.audit_log),
  0, 'a member cannot read the audit log'
);

reset role;
select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000002');

select ok(
  (select count(*) > 0 from public.audit_log),
  'an admin can read the audit log'
);

reset role;
select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000001');

select is(
  (select status::text from public.deactivate_member(
     (select id from tests.org_ids where slug = 'org-a'),
     'aaaaaaaa-0000-0000-0000-000000000002')),
  'deactivated', 'an owner deactivates an admin'
);

select throws_ok(
  $$ select public.deactivate_member(
       (select id from tests.org_ids where slug = 'org-a'),
       'aaaaaaaa-0000-0000-0000-000000000001') $$,
  'P0001', 'cannot_deactivate_self',
  'an owner cannot deactivate themselves'
);

-- Audit trail and the last owner -----------------------------------------------------

reset role;

select is(
  (select count(*)::int from public.audit_log where action = 'member.role_changed'),
  2, 'every role change is audited'
);

select is(
  (select count(*)::int from public.audit_log where action = 'member.deactivated'),
  3, 'every deactivation is audited'
);

select is(
  (select count(*)::int from public.audit_log where action = 'member.reactivated'),
  1, 'every reactivation is audited'
);

select throws_ok(
  $$ update public.organization_members set status = 'deactivated'
     where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' $$,
  'P0001', 'last_owner',
  'an org always keeps an active owner'
);

select * from finish();
rollback;
