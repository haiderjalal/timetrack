-- profiles: created from the Google profile on sign-up; each person reads
-- themselves and the people they share an org with, and edits only their name.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ayesha@example.com',
   '{"full_name": "Ayesha Khan", "avatar_url": "https://lh3.googleusercontent.com/a/x"}'),
  ('22222222-2222-2222-2222-222222222222', 'bilal@example.com',
   '{"name": "  Bilal Raza  ", "picture": "https://lh3.googleusercontent.com/a/y"}'),
  ('33333333-3333-3333-3333-333333333333', 'long@example.com',
   jsonb_build_object('full_name', repeat('x', 200)));

select results_eq(
  $$ select full_name, avatar_url from public.profiles
     where id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('Ayesha Khan', 'https://lh3.googleusercontent.com/a/x') $$,
  'sign-up creates a profile from the Google full_name and avatar_url'
);

select results_eq(
  $$ select full_name, avatar_url from public.profiles
     where id = '22222222-2222-2222-2222-222222222222' $$,
  $$ values ('Bilal Raza', 'https://lh3.googleusercontent.com/a/y') $$,
  'falls back to name and picture, trimmed'
);

select is(
  (select char_length(full_name) from public.profiles
   where id = '33333333-3333-3333-3333-333333333333'),
  120,
  'a very long Google name is truncated instead of blocking sign-up'
);

-- Ayesha, signed in
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);

select results_eq(
  'select email::text from public.profiles',
  $$ values ('ayesha@example.com') $$,
  'people see only themselves until they share an org'
);

select lives_ok(
  $$ update public.profiles set full_name = 'Ayesha K.'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  'people can change their own name'
);

select is(
  (select full_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Ayesha K.',
  'the new name is saved'
);

with changed as (
  update public.profiles set full_name = 'Hacked'
  where id = '22222222-2222-2222-2222-222222222222'
  returning 1
)
select is(count(*)::int, 0, 'nobody can rename someone else') from changed;

select throws_ok(
  $$ update public.profiles set email = 'new@example.com'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'the email comes from Google and cannot be edited'
);

select throws_ok(
  $$ insert into public.profiles (id, email)
     values ('44444444-4444-4444-4444-444444444444', 'fake@example.com') $$,
  '42501',
  null,
  'profiles cannot be inserted directly'
);

-- Signed out
reset role;
select set_config('role', 'anon', true);
select set_config('request.jwt.claims', '', true);

select throws_ok(
  'select 1 from public.profiles',
  '42501',
  null,
  'signed-out visitors cannot read profiles'
);

reset role;

delete from auth.users where id = '33333333-3333-3333-3333-333333333333';

select is(
  (select count(*)::int from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  0,
  'deleting the auth user deletes the profile'
);

select * from finish();
rollback;
