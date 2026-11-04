"use server";

import { redirect } from "next/navigation";

import { invitePath, orgDashboardPath } from "@/constants/routes";
import { requireUser } from "@/features/auth/services/currentUser";
import { INVITATION_TOKEN_PATTERN } from "@/lib/validations/invitation.schema";
import { logger } from "@/lib/logger";

import { acceptInvitationForCurrentUser } from "../services/acceptInvitation";
import { describeInvitationFailure } from "../utils/invitationErrors";

import type { ApiFailure } from "@/types/api";

/**
 * Joins the signed-in person, then opens the org's dashboard. This runs only on
 * the button press, never on page load, so link scanners can't use up a token.
 * Returns only when it fails.
 */
export async function acceptInvitation(token: string): Promise<ApiFailure> {
  if (!INVITATION_TOKEN_PATTERN.test(token)) {
    return { success: false, message: "This invitation link isn't valid." };
  }

  await requireUser(invitePath(token));

  const result = await acceptInvitationForCurrentUser(token);
  if (!result.ok) {
    return {
      success: false,
      message: describeInvitationFailure(result.failure),
    };
  }

  logger.info("invitation.accepted");
  redirect(orgDashboardPath(result.organizationSlug));
}
