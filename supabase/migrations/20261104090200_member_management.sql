-- change_member_role() and deactivate_member(): the only ways to change who is in
-- an org after they join (docs/database.md §6, docs/business-rules.md §1).
-- The last-owner rule is enforced by private.ensure_owner_remains.

-- Owners set admin or member. Owner roles stay as they are: transfer isn't built.
-- Errors: not_allowed, invalid_role, member_not_found.
create function public.change_member_role(
  p_org_id  uuid,
  p_user_id uuid,
  p_role    public.member_role
)
returns public.organization_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target  public.organization_members;
  v_updated public.organization_members;
begin
  if private.active_role(p_org_id) is distinct from 'owner' then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if p_role = 'owner' then
    raise exception 'invalid_role' using errcode = '22023';
  end if;

  select m.* into v_target
  from public.organization_members m
  where m.org_id = p_org_id and m.user_id = p_user_id and m.status = 'active'
  for update;

  if not found then
    raise exception 'member_not_found' using errcode = 'P0002';
  end if;

  if v_target.role = 'owner' then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if v_target.role = p_role then
    return v_target;
  end if;

  update public.organization_members
  set role = p_role
  where id = v_target.id
  returning * into v_updated;

  insert into public.audit_log (org_id, actor_id, action, entity_type, entity_id, before, after)
  values (
    p_org_id, (select auth.uid()), 'member.role_changed', 'organization_member', v_target.id,
    jsonb_build_object('role', v_target.role),
    jsonb_build_object('role', v_updated.role)
  );

  return v_updated;
end;
$$;

-- Removing someone keeps their history: they lose access at once, and their row
-- stays for reports. Admins can deactivate members only.
-- Errors: not_allowed, cannot_deactivate_self, member_not_found, last_owner.
create function public.deactivate_member(p_org_id uuid, p_user_id uuid)
returns public.organization_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_actor   public.member_role := private.active_role(p_org_id);
  v_target  public.organization_members;
  v_updated public.organization_members;
begin
  if v_actor is null or v_actor = 'member' then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if p_user_id = v_uid then
    raise exception 'cannot_deactivate_self' using errcode = 'P0001';
  end if;

  select m.* into v_target
  from public.organization_members m
  where m.org_id = p_org_id and m.user_id = p_user_id and m.status = 'active'
  for update;

  if not found then
    raise exception 'member_not_found' using errcode = 'P0002';
  end if;

  if v_actor = 'admin' and v_target.role <> 'member' then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  update public.organization_members
  set status = 'deactivated'
  where id = v_target.id
  returning * into v_updated;

  insert into public.audit_log (org_id, actor_id, action, entity_type, entity_id, before, after)
  values (
    p_org_id, v_uid, 'member.deactivated', 'organization_member', v_target.id,
    jsonb_build_object('status', v_target.status, 'role', v_target.role),
    jsonb_build_object('status', v_updated.status, 'role', v_updated.role)
  );

  return v_updated;
end;
$$;

revoke execute on function public.change_member_role(uuid, uuid, public.member_role) from public, anon;
revoke execute on function public.deactivate_member(uuid, uuid) from public, anon;
grant execute on function public.change_member_role(uuid, uuid, public.member_role) to authenticated;
grant execute on function public.deactivate_member(uuid, uuid) to authenticated;
