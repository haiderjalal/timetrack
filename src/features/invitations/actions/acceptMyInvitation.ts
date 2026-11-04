"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { ROUTES, orgDashboardPath } from "@/constants/routes";
import { requireUser } from "@/features/auth/services/currentUser";
import { logger } from "@/lib/logger";

import { acceptInvitationByIdForCurrentUser } from "../services/acceptMyInvitation";
import { describeInvitationFailure } from "../utils/invitationErrors";

import type { ApiFailure } from "@/types/api";

const invitationIdSchema = z.uuid();

/**
 * Joins the signed-in person to an org that invited their email, from their account
 * or onboarding page. Runs only on the button press. Returns only when it fails.
 */
export async function acceptMyInvitation(
  invitationId: string,
): Promise<ApiFailure> {
  await requireUser(ROUTES.account);

  const parsed = invitationIdSchema.safeParse(invitationId);
  if (!parsed.success) {
    return { success: false, message: "That invitation no longer exists." };
  }

  const result = await acceptInvitationByIdForCurrentUser(parsed.data);
  if (!result.ok) {
    return {
      success: false,
      message: describeInvitationFailure(result.failure),
    };
  }

  logger.info("invitation.accepted", { via: "account" });
  redirect(orgDashboardPath(result.organizationSlug));
}
