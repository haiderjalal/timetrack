-- Joining without the email link (docs/architecture.md §6.1): a signed-in invitee
-- sees their open invitations and joins by id, but only as the invited address.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

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
  ('cccccccc-0000-0000-0000-000000000001', 'invitee@example.com', '{"full_name": "Invitee"}'),
  ('cccccccc-0000-0000-0000-000000000002', 'stranger@example.com', '{"full_name": "Stranger"}'),
  ('cccccccc-0000-0000-0000-000000000003', 'late@example.com', '{"full_name": "Late"}');

select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000001');
select public.create_organization('Org A', 'org-a', 'Asia/Karachi', tests.default_schedule());

select lives_ok(
  $$ select public.create_invitation(
       (select id from public.organizations where slug = 'org-a'),
       'invitee@example.com', 'member', tests.hash('join-token-invitee')) $$,
  'an owner invites the invitee'
);

select lives_ok(
  $$ select public.create_invitation(
       (select id from public.organizations where slug = 'org-a'),
       'late@example.com', 'member', tests.hash('join-token-late')) $$,
  'an owner invites someone who will be late to join'
);

select lives_ok(
  $$ select public.create_invitation(
       (select id from public.organizations where slug = 'org-a'),
       'other@example.com', 'member', tests.hash('join-token-other')) $$,
  'an owner invites an address nobody has signed in with'
);

reset role;

-- Invitation ids, read by the tests below.
create table tests.ids (name text primary key, id uuid);
grant select on tests.ids to authenticated;
insert into tests.ids
select split_part(i.email::text, '@', 1), i.id from public.invitations i;

-- The invitee sees only their own open invitation ----------------------------------

select tests.sign_in('cccccccc-0000-0000-0000-000000000001');

select results_eq(
  $$ select organization_slug, invited_role::text from public.list_my_invitations() $$,
  $$ values ('org-a'::text, 'member'::text) $$,
  'the invitee sees the org and role of their own invitation'
);

reset role;
select tests.sign_in('cccccccc-0000-0000-0000-000000000002');

select is(
  (select count(*)::int from public.list_my_invitations()),
  0, 'a stranger sees nobody else''s invitations'
);

-- Joining by id, as the invitee --------------------------------------------------------

reset role;
select tests.sign_in('cccccccc-0000-0000-0000-000000000001');

select is(
  (select slug::text from public.accept_my_invitation(
     (select invitation_id from public.list_my_invitations()))),
  'org-a', 'the invitee joins by id'
);

select is(
  (select role::text from public.organization_members
   where user_id = 'cccccccc-0000-0000-0000-000000000001'),
  'member', 'the invitee joins with the invited role'
);

select is(
  (select count(*)::int from public.list_my_invitations()),
  0, 'an accepted invitation leaves the list'
);

select throws_ok(
  $$ select public.accept_my_invitation((select id from tests.ids where name = 'invitee')) $$,
  'P0001', 'invitation_unavailable',
  'an invitation works once'
);

-- Wrong address, revoked, and expired invitations ---------------------------------

reset role;
select tests.sign_in('cccccccc-0000-0000-0000-000000000002');

select throws_ok(
  $$ select public.accept_my_invitation((select id from tests.ids where name = 'other')) $$,
  'P0001', 'invitation_email_mismatch',
  'a signed-in stranger cannot join with someone else''s invitation'
);

reset role;
select tests.sign_in('aaaaaaaa-0000-0000-0000-000000000001');

select lives_ok(
  $$ select public.revoke_invitation((select id from tests.ids where name = 'other')) $$,
  'an owner revokes the invitation nobody has used'
);

reset role;
select tests.sign_in('cccccccc-0000-0000-0000-000000000002');

select throws_ok(
  $$ select public.accept_my_invitation((select id from tests.ids where name = 'other')) $$,
  'P0001', 'invitation_unavailable',
  'a revoked invitation cannot be joined, even by the right address'
);

reset role;
update public.invitations set expires_at = now() - interval '1 minute'
where email = 'late@example.com';

select tests.sign_in('cccccccc-0000-0000-0000-000000000003');

select is(
  (select count(*)::int from public.list_my_invitations()),
  0, 'an expired invitation leaves the list'
);

select throws_ok(
  $$ select public.accept_my_invitation((select id from tests.ids where name = 'late')) $$,
  'P0001', 'invitation_expired',
  'an expired invitation cannot be joined'
);

-- The token path still works and shares the rules ---------------------------------

reset role;
select tests.sign_in('cccccccc-0000-0000-0000-000000000003');

select throws_ok(
  $$ select public.accept_invitation('join-token-late') $$,
  'P0001', 'invitation_expired',
  'the token path refuses an expired invitation too'
);

-- Signed-out visitors ------------------------------------------------------------------

reset role;
select set_config('role', 'anon', true);

select throws_ok(
  $$ select public.list_my_invitations() $$,
  '42501', null,
  'signed-out visitors cannot list invitations'
);

select throws_ok(
  $$ select public.accept_my_invitation((select id from tests.ids where name = 'invitee')) $$,
  '42501', null,
  'signed-out visitors cannot join by id'
);

reset role;

select * from finish();
rollback;
