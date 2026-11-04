"use server";

import { revalidatePath } from "next/cache";

import { orgTeamPath } from "@/constants/routes";
import { requireMembership } from "@/features/organizations/services/membership";
import { changeMemberRoleSchema } from "@/lib/validations/member.schema";

import { changeMemberRoleForOrg } from "../services/changeMemberRole";
import { describeMemberFailure } from "../utils/memberErrors";

import type { ApiResponse } from "@/types/api";

/**
 * Owners set admin or member. The database enforces the same rule; this check
 * just stops early for everyone else.
 */
export async function changeMemberRole(
  orgSlug: string,
  userId: string,
  role: string,
): Promise<ApiResponse<null>> {
  const { membership } = await requireMembership(orgSlug);

  if (membership.role !== "owner") {
    return { success: false, message: describeMemberFailure("not_allowed") };
  }

  const parsed = changeMemberRoleSchema.safeParse({ userId, role });
  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]?.message ??
        describeMemberFailure("invalid_role"),
    };
  }

  const result = await changeMemberRoleForOrg({
    orgId: membership.organization.id,
    userId: parsed.data.userId,
    role: parsed.data.role,
  });

  if (!result.ok) {
    return { success: false, message: describeMemberFailure(result.failure) };
  }

  revalidatePath(orgTeamPath(orgSlug));
  return { success: true, message: "Role updated.", data: null };
}
