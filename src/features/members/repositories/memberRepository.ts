import "server-only";

import { failDataAccess } from "@/lib/supabase/errors";
import { toRpcFailure } from "@/lib/supabase/rpcFailure";

import { MEMBER_FAILURES } from "../utils/memberErrors";

import type { InvitableRole } from "@/features/organizations/utils/roles";
import type { TypedSupabaseClient } from "@/lib/supabase/server";
import type { MemberFailure } from "../utils/memberErrors";
import type { TeamMember } from "../types/member";

export type MemberResult = { ok: true } | { ok: false; failure: MemberFailure };

/** Everyone in the org, including people who were deactivated. */
export async function listTeamMembers(
  supabase: TypedSupabaseClient,
  orgId: string,
): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select(
      "user_id, role, status, joined_at, profile:profiles!inner(email, full_name, avatar_url)",
    )
    .eq("org_id", orgId)
    .order("joined_at", { ascending: true });

  if (error) failDataAccess("members.list", error);

  return data.map((row) => ({
    userId: row.user_id,
    name: row.profile.full_name ?? row.profile.email,
    email: row.profile.email,
    avatarUrl: row.profile.avatar_url,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
  }));
}

export async function changeMemberRoleRecord(
  supabase: TypedSupabaseClient,
  params: { orgId: string; userId: string; role: InvitableRole },
): Promise<MemberResult> {
  const { error } = await supabase.rpc("change_member_role", {
    p_org_id: params.orgId,
    p_user_id: params.userId,
    p_role: params.role,
  });

  if (error) {
    return {
      ok: false,
      failure: toRpcFailure("members.change_role", error, MEMBER_FAILURES),
    };
  }

  return { ok: true };
}

export async function deactivateMemberRecord(
  supabase: TypedSupabaseClient,
  params: { orgId: string; userId: string },
): Promise<MemberResult> {
  const { error } = await supabase.rpc("deactivate_member", {
    p_org_id: params.orgId,
    p_user_id: params.userId,
  });

  if (error) {
    return {
      ok: false,
      failure: toRpcFailure("members.deactivate", error, MEMBER_FAILURES),
    };
  }

  return { ok: true };
}
