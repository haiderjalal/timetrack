-- invitations: email invites that add someone to an org (docs/database.md §4.4,
-- docs/architecture.md §6.3). The raw token only ever sits in the invitation
-- email; the table keeps its SHA-256 hash, so a leaked table can't be used to join.
-- Writes go only through the RPCs below.

-- The caller's role in an org, or null when they aren't an active member. The
-- RPCs in this and the next migration share it.
create function private.active_role(p_org_id uuid)
returns public.member_role
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.organization_members m
  where m.org_id = p_org_id
    and m.user_id = (select auth.uid())
    and m.status = 'active'
$$;

revoke execute on function private.active_role(uuid) from public, anon;
grant execute on function private.active_role(uuid) to authenticated;

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  email       extensions.citext not null
              check (email::text ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email::text) <= 254),
  role        public.member_role not null default 'member' check (role <> 'owner'),
  token_hash  bytea not null unique check (octet_length(token_hash) = 32),
  invited_by  uuid not null references public.profiles (id),
  expires_at  timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id),
  revoked_at  timestamptz,
  created_at  timestamptz not null default now(),
  check ((accepted_at is null) = (accepted_by is null)),
  check (accepted_at is null or revoked_at is null)
);

-- One open invitation per address; re-inviting revokes the previous one.
create unique index invitations_one_open_per_email
  on public.invitations (org_id, email) where accepted_at is null and revoked_at is null;
create index invitations_invited_by on public.invitations (invited_by);
create index invitations_accepted_by on public.invitations (accepted_by);

alter table public.invitations enable row level security;

revoke all on table public.invitations from anon, authenticated;
grant select on table public.invitations to authenticated;
grant select, insert, update, delete on table public.invitations to service_role;

create policy invitations_select on public.invitations
for select to authenticated
using (org_id in (select private.admin_org_ids()));

-- create_invitation(): owners invite admins and members, admins invite members.
-- Errors: not_allowed, invalid_role, already_member, invitation_conflict.
create function public.create_invitation(
  p_org_id     uuid,
  p_email      text,
  p_role       public.member_role,
  p_token_hash text                      -- hex SHA-256 of the raw token, made by the app
)
returns public.invitations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role public.member_role := private.active_role(p_org_id);
  v_email      text := lower(btrim(p_email));
  v_row        public.invitations;
begin
  if v_actor_role is null or v_actor_role = 'member' then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if p_role = 'owner' then
    raise exception 'invalid_role' using errcode = '22023';
  end if;

  if v_actor_role = 'admin' and p_role <> 'member' then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.organization_members m
    join public.profiles p on p.id = m.user_id
    where m.org_id = p_org_id
      and m.status = 'active'
      and p.email::text = v_email
  ) then
    raise exception 'already_member' using errcode = 'P0001';
  end if;

  update public.invitations
  set revoked_at = now()
  where org_id = p_org_id
    and email::text = v_email
    and accepted_at is null
    and revoked_at is null;

  insert into public.invitations (org_id, email, role, token_hash, invited_by)
  values (p_org_id, v_email, p_role, decode(p_token_hash, 'hex'), (select auth.uid()))
  returning * into v_row;

  return v_row;
exception
  -- Two admins inviting the same address at the same moment.
  when unique_violation then
    raise exception 'invitation_conflict' using errcode = 'P0001';
end;
$$;

-- revoke_invitation(): an admin or owner cancels an open invitation.
-- Errors: not_allowed, invitation_unavailable.
create function public.revoke_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_role   public.member_role;
begin
  select i.org_id into v_org_id from public.invitations i where i.id = p_invitation_id;

  v_role := private.active_role(v_org_id);
  if v_role is null or v_role = 'member' then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  update public.invitations
  set revoked_at = now()
  where id = p_invitation_id
    and accepted_at is null
    and revoked_at is null;

  if not found then
    raise exception 'invitation_unavailable' using errcode = 'P0001';
  end if;
end;
$$;

-- preview_invitation(): what the invitation page shows before the person joins.
-- The org and role go only to someone signed in. The address is never returned,
-- just whether it matches the signed-in account.
create function public.preview_invitation(p_token text)
returns table (
  invitation_state  text,
  organization_name text,
  organization_slug text,
  invited_role      public.member_role
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email extensions.citext;
  v_inv   public.invitations;
  v_org   public.organizations;
  v_state text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select p.email into v_email from public.profiles p where p.id = v_uid;

  select i.* into v_inv
  from public.invitations i
  where i.token_hash = sha256(convert_to(p_token, 'UTF8'));

  if not found or v_inv.accepted_at is not null or v_inv.revoked_at is not null then
    return query select 'unavailable'::text, null::text, null::text, null::public.member_role;
    return;
  end if;

  select o.* into v_org
  from public.organizations o
  where o.id = v_inv.org_id and o.deleted_at is null;

  if not found then
    return query select 'unavailable'::text, null::text, null::text, null::public.member_role;
    return;
  end if;

  v_state := case
    when v_inv.expires_at <= now() then 'expired'
    when v_inv.email <> v_email then 'wrong_account'
    else 'ready'
  end;

  return query select v_state, v_org.name, v_org.slug::text, v_inv.role;
end;
$$;

-- accept_invitation(): joins the signed-in person to the org. The address must
-- match the invitation, and the token works once. Returns the org so the page
-- can open its dashboard.
-- Errors: not_authenticated, invitation_unavailable, invitation_expired,
-- invitation_email_mismatch.
create function public.accept_invitation(p_token text)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid := (select auth.uid());
  v_email      extensions.citext;
  v_inv        public.invitations;
  v_org        public.organizations;
  v_membership public.organization_members;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select p.email into v_email from public.profiles p where p.id = v_uid;

  -- Locked, so two taps or two tabs can't both accept the same invitation.
  select i.* into v_inv
  from public.invitations i
  where i.token_hash = sha256(convert_to(p_token, 'UTF8'))
  for update;

  if not found or v_inv.accepted_at is not null or v_inv.revoked_at is not null then
    raise exception 'invitation_unavailable' using errcode = 'P0001';
  end if;

  if v_inv.expires_at <= now() then
    raise exception 'invitation_expired' using errcode = 'P0001';
  end if;

  if v_inv.email <> v_email then
    raise exception 'invitation_email_mismatch' using errcode = 'P0001';
  end if;

  select o.* into v_org
  from public.organizations o
  where o.id = v_inv.org_id and o.deleted_at is null;

  if not found then
    raise exception 'invitation_unavailable' using errcode = 'P0001';
  end if;

  select m.* into v_membership
  from public.organization_members m
  where m.org_id = v_inv.org_id and m.user_id = v_uid
  for update;

  if not found then
    insert into public.organization_members (org_id, user_id, role)
    values (v_inv.org_id, v_uid, v_inv.role);
  elsif v_membership.status = 'deactivated' then
    -- A re-invited person comes back with the role on the new invitation, and
    -- their history stays on the same row.
    update public.organization_members
    set status = 'active', role = v_inv.role
    where id = v_membership.id;

    insert into public.audit_log (org_id, actor_id, action, entity_type, entity_id, before, after)
    values (
      v_inv.org_id, v_uid, 'member.reactivated', 'organization_member', v_membership.id,
      jsonb_build_object('status', v_membership.status, 'role', v_membership.role),
      jsonb_build_object('status', 'active', 'role', v_inv.role)
    );
  end if;
  -- An active member keeps their current role: accepting never downgrades anyone.

  update public.invitations
  set accepted_at = now(), accepted_by = v_uid
  where id = v_inv.id;

  update public.profiles set last_org_id = v_org.id where id = v_uid;

  return v_org;
end;
$$;

revoke execute on function public.create_invitation(uuid, text, public.member_role, text) from public, anon;
revoke execute on function public.revoke_invitation(uuid) from public, anon;
revoke execute on function public.preview_invitation(text) from public, anon;
revoke execute on function public.accept_invitation(text) from public, anon;
grant execute on function public.create_invitation(uuid, text, public.member_role, text) to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.preview_invitation(text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
