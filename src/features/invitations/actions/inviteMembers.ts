"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { orgTeamPath } from "@/constants/routes";
import { requireMembership } from "@/features/organizations/services/membership";
import { canInviteAs } from "@/features/organizations/utils/roles";
import { logger } from "@/lib/logger";
import { inviteMembersSchema } from "@/lib/validations/invitation.schema";

import { inviteMembersToOrganization } from "../services/inviteMembers";
import { sendInvitationEmails } from "../services/sendInvitationEmails";
import { describeInvitationFailure } from "../utils/invitationErrors";

import type { InviteMembersInput } from "@/lib/validations/invitation.schema";
import type { ApiResponse } from "@/types/api";
import type { InviteMembersSummary } from "../types/invitation";

/**
 * Invites people from the team page. The response lists addresses and counts
 * only: the tokens go into the emails, which send after the response.
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
  const { name: organizationName } = membership.organization;

  if (sent.length > 0) {
    after(() =>
      sendInvitationEmails({ invitations: sent, role, organizationName }),
    );
  }

  revalidatePath(orgTeamPath(orgSlug));
  logger.info("invitations.sent", {
    orgId: membership.organization.id,
    sent: sent.length,
    alreadyMembers: alreadyMembers.length,
    failed: failed.length,
  });

  return {
    success: true,
    message: "Invitations sent.",
    data: {
      invited: sent.map((invitation) => invitation.email),
      alreadyMembers,
      failed,
    },
  };
}
