"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { orgTeamPath } from "@/constants/routes";
import { requireMembership } from "@/features/organizations/services/membership";
import { canManageOrganization } from "@/features/organizations/utils/roles";

import { revokeOpenInvitation } from "../services/revokeInvitation";
import { describeInvitationFailure } from "../utils/invitationErrors";

import type { ApiResponse } from "@/types/api";

const invitationIdSchema = z.uuid();

/** Owners and admins cancel an open invitation; its link stops working at once. */
export async function revokeInvitation(
  orgSlug: string,
  invitationId: string,
): Promise<ApiResponse<null>> {
  const { membership } = await requireMembership(orgSlug);

  if (!canManageOrganization(membership.role)) {
    return {
      success: false,
      message: describeInvitationFailure("not_allowed"),
    };
  }

  const parsed = invitationIdSchema.safeParse(invitationId);
  if (!parsed.success) {
    return { success: false, message: "That invitation no longer exists." };
  }

  const result = await revokeOpenInvitation(parsed.data);
  if (!result.ok) {
    return {
      success: false,
      message: describeInvitationFailure(result.failure),
    };
  }

  revalidatePath(orgTeamPath(orgSlug));
  return { success: true, message: "Invitation revoked.", data: null };
}
