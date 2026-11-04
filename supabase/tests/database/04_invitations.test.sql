-- Invitations (docs/architecture.md §6.3, docs/database.md §4.4, §6): admins
-- invite members, owners also invite admins, only the invited address can join,
-- and each token works once.
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

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

-- The app stores sha256(token) as hex; the tests do the same for fixed tokens.
create function tests.hash(p_token text) returns text language sql as $$
  select encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
$$;
grant execute on function tests.hash(text) to authenticated;

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'owner-a@example.com', '{"full_name": "Owner A"}'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'admin-a@example.com', '{"full_name": "Admin A"}'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'member-a@example.com', '{"full_name": "Member A"}'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'owner-b@example.com', '{"full_name": "Owner B"}'),
  ('cccccccc-0000-0000-0000-000000000001', 'invitee@example.com', '{"full_name": "Invitee"}'),
  ('cccccccc-0000-0000-0000-000000000002', 'late@example.com', '{"full_name": "Late"}');

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000001');
select public.create_organization('Org A', 'org-a', 'Asia/Karachi', tests.default_schedule());
reset role;
select tests.sign_in('bbbbbbbb-0000-0000-0000-000000000001');
select public.create_organization('Org B', 'org-b', 'Europe/London', tests.default_schedule());
reset role;

create table tests.org_ids as select slug::text as slug, id from public.organizations;
grant select on tests.org_ids to authenticated;

-- Admin and member fixtures are added directly; the invitation flow is tested below.
insert into public.organization_members (org_id, user_id, role)
select o.id, u.user_id, u.role::public.member_role
from tests.org_ids o
cross join (values
  ('aaaaaaaa-0000-0000-0000-000000000002'::uuid, 'admin'),
  ('aaaaaaaa-0000-0000-0000-000000000003'::uuid, 'member')
) as u (user_id, role)
where o.slug = 'org-a';

-- Owner A: invites ----------------------------------------------------------------

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000001');

select lives_ok(
  $$ select public.create_invitation(
       (select id from tests.org_ids where slug = 'org-a'),
       'invitee@example.com', 'member', tests.hash('token-first')) $$,
  'an owner invites a member'
);

select lives_ok(
  $$ select public.create_invitation(
       (select id from tests.org_ids where slug = 'org-a'),
       'invitee@example.com', 'member', tests.hash('token-second')) $$,
  're-inviting the same address replaces the open invitation'
);

select lives_ok(
  $$ select public.create_invitation(
       (select id from tests.org_ids where slug = 'org-a'),
       'Admin-Candidate@Example.com', 'admin', tests.hash('token-admin')) $$,
  'an owner invites an admin'
);

select throws_ok(
  $$ select public.create_invitation(
       (select id from tests.org_ids where slug = 'org-a'),
       'owner-two@example.com', 'owner', tests.hash('token-owner')) $$,
  '22023', 'invalid_role',
  'nobody can invite an owner'
);

reset role;

select is(
  (select count(*)::int from public.invitations
   where email = 'invitee@example.com' and accepted_at is null and revoked_at is null),
  1, 'one open invitation per address'
);
select is(
  (select count(*)::int from public.invitations
   where email = 'invitee@example.com' and revoked_at is not null),
  1, 're-inviting revokes the earlier invitation'
);

-- Admin A and member A ------------------------------------------------------------

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000002');

select lives_ok(
  $$ select public.create_invitation(
       (select id from tests.org_ids where slug = 'org-a'),
       'friend@example.com', 'member', tests.hash('token-friend')) $$,
  'an admin invites a member'
);

select throws_ok(
  $$ select public.create_invitation(
       (select id from tests.org_ids where slug = 'org-a'),
       'another-admin@example.com', 'admin', tests.hash('token-admin-two')) $$,
  '42501', 'not_allowed',
  'an admin cannot invite an admin'
);

select throws_ok(
  $$ select public.create_invitation(
       (select id from tests.org_ids where slug = 'org-a'),
       'member-a@example.com', 'member', tests.hash('token-existing')) $$,
  'P0001', 'already_member',
  'people who are already members cannot be invited'
);

select is(
  (select count(*)::int from public.invitations),
  4, 'an admin sees every invitation in their org'
);

reset role;
select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000003');

select is(
  (select count(*)::int from public.invitations),
  0, 'a member sees no invitations'
);

select throws_ok(
  $$ select public.create_invitation(
       (select id from tests.org_ids where slug = 'org-a'),
       'member-two@example.com', 'member', tests.hash('token-member')) $$,
  '42501', 'not_allowed',
  'a member cannot invite anyone'
);

reset role;

-- Owner B: another org, then the wrong account for org A's invitation -------------

select tests.sign_in('bbbbbbbb-0000-0000-0000-000000000001');

select is(
  (select count(*)::int from public.invitations),
  0, 'owner B sees no invitations from org A'
);

select throws_ok(
  $$ select public.create_invitation(
       (select id from tests.org_ids where slug = 'org-a'),
       'outsider@example.com', 'member', tests.hash('token-outsider')) $$,
  '42501', 'not_allowed',
  'owner B cannot invite into org A'
);

select is(
  (select invitation_state from public.preview_invitation('token-second')),
  'wrong_account', 'a signed-in stranger sees that the address does not match'
);

select throws_ok(
  $$ select public.accept_invitation('token-second') $$,
  'P0001', 'invitation_email_mismatch',
  'the invitation cannot be accepted from another account'
);

reset role;

-- The invitee accepts ---------------------------------------------------------------

select tests.sign_in('cccccccc-0000-0000-0000-000000000001');

select results_eq(
  $$ select invitation_state, organization_name, organization_slug, invited_role::text
     from public.preview_invitation('token-second') $$,
  $$ values ('ready'::text, 'Org A'::text, 'org-a'::text, 'member'::text) $$,
  'the invitee sees the org and role'
);

select is(
  (select invitation_state from public.preview_invitation('token-first')),
  'unavailable', 'a revoked invitation is unavailable'
);

select throws_ok(
  $$ select public.accept_invitation('token-first') $$,
  'P0001', 'invitation_unavailable',
  'a revoked invitation cannot be accepted'
);

select is(
  (select slug::text from public.accept_invitation('token-second')),
  'org-a', 'the invitee joins org A'
);

select is(
  (select role::text from public.organization_members where user_id = 'cccccccc-0000-0000-0000-000000000001'),
  'member', 'the invitee joins with the invited role'
);

select is(
  (select last_org_id from public.profiles where id = 'cccccccc-0000-0000-0000-000000000001'),
  (select id from tests.org_ids where slug = 'org-a'),
  'sign-in afterwards lands in org A'
);

select throws_ok(
  $$ select public.accept_invitation('token-second') $$,
  'P0001', 'invitation_unavailable',
  'an invitation works once'
);

select throws_ok(
  $$ select public.accept_invitation('token-unknown') $$,
  'P0001', 'invitation_unavailable',
  'an unknown token is refused'
);

reset role;

-- Signed-out visitors ---------------------------------------------------------------

select set_config('role', 'anon', true);

select throws_ok(
  $$ select public.accept_invitation('token-second') $$,
  '42501', null,
  'signed-out visitors cannot accept an invitation'
);

reset role;

-- Expired ---------------------------------------------------------------------------

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000001');

select lives_ok(
  $$ select public.create_invitation(
       (select id from tests.org_ids where slug = 'org-a'),
       'late@example.com', 'member', tests.hash('token-late')) $$,
  'an owner invites someone who will be late to accept'
);

reset role;
update public.invitations set expires_at = now() - interval '1 minute'
where email = 'late@example.com';

select tests.sign_in('cccccccc-0000-0000-0000-000000000002');

select is(
  (select invitation_state from public.preview_invitation('token-late')),
  'expired', 'an expired invitation says so'
);

select throws_ok(
  $$ select public.accept_invitation('token-late') $$,
  'P0001', 'invitation_expired',
  'an expired invitation cannot be accepted'
);

reset role;

-- Revoking --------------------------------------------------------------------------

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000001');

select lives_ok(
  $$ select public.revoke_invitation(
       (select id from public.invitations where email = 'admin-candidate@example.com')) $$,
  'an owner revokes an open invitation'
);

select throws_ok(
  $$ select public.revoke_invitation(
       (select id from public.invitations where email = 'admin-candidate@example.com')) $$,
  'P0001', 'invitation_unavailable',
  'a revoked invitation cannot be revoked again'
);

reset role;
select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000003');

select throws_ok(
  $$ select public.revoke_invitation(
       (select id from public.invitations where email = 'friend@example.com')) $$,
  '42501', 'not_allowed',
  'a member cannot revoke invitations'
);

reset role;

select * from finish();
rollback;
