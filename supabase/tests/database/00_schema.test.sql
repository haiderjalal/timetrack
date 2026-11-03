-- Default deny: every public table has RLS, anon has no table privileges,
-- and the private helpers can't be called by anon.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

select is(
  (
    select count(*)::int
    from pg_catalog.pg_tables
    where schemaname = 'public' and not rowsecurity
  ),
  0,
  'every table in public has row level security enabled'
);

select is(
  (
    select count(*)::int
    from information_schema.role_table_grants
    where grantee = 'anon' and table_schema = 'public'
  ),
  0,
  'anon has no privileges on any public table'
);

select is(
  (
    select count(*)::int
    from information_schema.role_table_grants
    where grantee = 'authenticated'
      and table_schema = 'public'
      and privilege_type = 'DELETE'
  ),
  0,
  'signed-in users can delete nothing directly'
);

select ok(
  not has_function_privilege('anon', 'public.create_organization(text, text, text, jsonb)', 'execute'),
  'anon cannot create organizations'
);

select ok(
  not has_function_privilege('anon', 'private.member_org_ids()', 'execute'),
  'anon cannot call the membership helper'
);

select ok(
  not has_function_privilege('authenticated', 'private.insert_profile(uuid, text, jsonb)', 'execute'),
  'signed-in users cannot create profiles directly'
);

select ok(
  not has_schema_privilege('anon', 'private', 'usage'),
  'anon cannot use the private schema'
);

select * from finish();
rollback;
