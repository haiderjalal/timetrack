-- Signed-in invitees can join without the email link (docs/architecture.md §6.1).
-- Joining checks that the signed-in account's email is the invited address, so
-- the token isn't needed for this path. accept_invitation(token) keeps working,
-- and both paths share the same join rules in private.join_invitation().

-- The join itself. Only the RPCs in this migration call it, so it isn't granted to anyone.
-- Errors: not_authenticated (42501), invitation_unavailable, invitation_expired,
-- invitation_email_mismatch (P0001).
create function private.join_invitation(p_invitation_id uuid)
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
  where i.id = p_invitation_id
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

revoke execute on function private.join_invitation(uuid) from public, anon, authenticated;

-- accept_invitation(token): the same join, found by the token's hash. Replaces the
-- version in 20261104090100_invitations.sql, which held the join rules inline.
create or replace function public.accept_invitation(p_token text)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select i.id into v_invitation_id
  from public.invitations i
  where i.token_hash = sha256(convert_to(p_token, 'UTF8'));

  if not found then
    raise exception 'invitation_unavailable' using errcode = 'P0001';
  end if;

  return private.join_invitation(v_invitation_id);
end;
$$;

-- list_my_invitations(): open, unexpired invitations addressed to the signed-in
-- email. Returns the id the join needs, but never the token or the hash.
create function public.list_my_invitations()
returns table (
  invitation_id         uuid,
  organization_name     text,
  organization_slug     text,
  organization_timezone text,
  invited_role          public.member_role,
  expires_at            timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, o.name, o.slug::text, o.timezone, i.role, i.expires_at
  from public.invitations i
  join public.organizations o on o.id = i.org_id
  join public.profiles p on p.id = (select auth.uid())
  where i.email = p.email
    and i.accepted_at is null
    and i.revoked_at is null
    and i.expires_at > now()
    and o.deleted_at is null
  order by i.created_at desc
$$;

-- accept_my_invitation(id): joins the signed-in person, provided their email is
-- the invited address. Errors match accept_invitation.
create function public.accept_my_invitation(p_invitation_id uuid)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.join_invitation(p_invitation_id);
end;
$$;

revoke execute on function public.list_my_invitations() from public, anon;
revoke execute on function public.accept_my_invitation(uuid) from public, anon;
grant execute on function public.list_my_invitations() to authenticated;
grant execute on function public.accept_my_invitation(uuid) to authenticated;
