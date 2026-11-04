"use server";

import { revalidatePath } from "next/cache";

import { orgTeamPath } from "@/constants/routes";
import { requireMembership } from "@/features/organizations/services/membership";
import { canManageOrganization } from "@/features/organizations/utils/roles";
import { deactivateMemberSchema } from "@/lib/validations/member.schema";

import { deactivateMemberInOrg } from "../services/deactivateMember";
import { describeMemberFailure } from "../utils/memberErrors";

import type { ApiResponse } from "@/types/api";

/**
 * Owners deactivate anyone, admins deactivate members. The database enforces
 * both rules and the last-owner rule; this check just stops early.
 */
export async function deactivateMember(
  orgSlug: string,
  userId: string,
): Promise<ApiResponse<null>> {
  const { membership } = await requireMembership(orgSlug);

  if (!canManageOrganization(membership.role)) {
    return { success: false, message: describeMemberFailure("not_allowed") };
  }

  const parsed = deactivateMemberSchema.safeParse({ userId });
  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]?.message ??
        describeMemberFailure("member_not_found"),
    };
  }

  const result = await deactivateMemberInOrg({
    orgId: membership.organization.id,
    userId: parsed.data.userId,
  });

  if (!result.ok) {
    return { success: false, message: describeMemberFailure(result.failure) };
  }

  revalidatePath(orgTeamPath(orgSlug));
  return { success: true, message: "Member deactivated.", data: null };
}
