"use server";

import { revalidatePath } from "next/cache";

import { orgTeamPath } from "@/constants/routes";
import { requireMembership } from "@/features/organizations/services/membership";
import { canInviteAs } from "@/features/organizations/utils/roles";
import { getEmailSettings } from "@/lib/email/emailSettings";
import { logger } from "@/lib/logger";
import { inviteMembersSchema } from "@/lib/validations/invitation.schema";

import { inviteMembersToOrganization } from "../services/inviteMembers";
import { sendInvitationEmails } from "../services/sendInvitationEmails";
import { describeInvitationFailure } from "../utils/invitationErrors";
import { describeInviteSummary } from "../utils/describeInviteSummary";

import type { InviteMembersInput } from "@/lib/validations/invitation.schema";
import type { ApiResponse } from "@/types/api";
import type { InviteMembersSummary } from "../types/invitation";

/**
 * Invites people from the team page. It sends each email before answering, so
 * the result says whether the emails went out. The response carries addresses
 * and counts only: the tokens travel in the emails.
 */
export async function inviteMembers(
  orgSlug: string,
  input: InviteMembersInput,
): Promise<ApiResponse<InviteMembersSummary>> {
  const { membership } = await requireMembership(orgSlug);

  const parsed = inviteMembersSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Check the addresses and try again.",
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    };
  }

  const { role } = parsed.data;
  if (!canInviteAs(membership.role, role)) {
    return {
      success: false,
      message: describeInvitationFailure("not_allowed"),
    };
  }

  // Checked before anything is created, so a missing sender leaves no pending invitations behind.
  if (!getEmailSettings(process.env)) {
    return {
      success: false,
      message:
        "Email isn't set up yet, so no invitations were sent. Add EMAIL_FROM and RESEND_API_KEY, then try again.",
    };
  }

  const emails = [
    ...new Set(parsed.data.emails.map((email) => email.toLowerCase())),
  ];
  const result = await inviteMembersToOrganization({
    orgId: membership.organization.id,
    emails,
    role,
  });

  if (!result.ok) {
    return {
      success: false,
      message: describeInvitationFailure(result.failure),
    };
  }

  const { sent, alreadyMembers, failed } = result.outcome;
  const notEmailed = await sendInvitationEmails({
    invitations: sent,
    role,
    organizationName: membership.organization.name,
  });

  const summary: InviteMembersSummary = {
    invited: sent
      .map((invitation) => invitation.email)
      .filter((email) => !notEmailed.includes(email)),
    alreadyMembers,
    failed: [...failed, ...notEmailed],
  };

  revalidatePath(orgTeamPath(orgSlug));
  logger.info("invitations.sent", {
    orgId: membership.organization.id,
    invited: summary.invited.length,
    alreadyMembers: alreadyMembers.length,
    failed: summary.failed.length,
  });

  const message = describeInviteSummary(summary);
  if (summary.failed.length > 0) return { success: false, message };

  return { success: true, message, data: summary };
}
