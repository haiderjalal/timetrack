import "server-only";

import { invitePath } from "@/constants/routes";
import { ROLE_LABELS } from "@/features/organizations/utils/roles";
import { sendEmail } from "@/lib/email/sendEmail";
import { InvitationEmail } from "@/lib/email/templates/InvitationEmail";
import { getSiteUrl } from "@/lib/getSiteUrl";

import { INVITATION_VALID_DAYS } from "../constants/invitations";

import type { InvitableRole } from "@/features/organizations/utils/roles";
import type { SentInvitation } from "./inviteMembers";

export interface SendInvitationEmailsParams {
  invitations: SentInvitation[];
  role: InvitableRole;
  organizationName: string;
}

/**
 * Emails each new invitation and returns the addresses that didn't go out. The
 * invite action waits for this, so the admin is told the real outcome.
 */
export async function sendInvitationEmails({
  invitations,
  role,
  organizationName,
}: SendInvitationEmailsParams): Promise<string[]> {
  const roleLabel = ROLE_LABELS[role];

  const results = await Promise.all(
    invitations.map(async ({ email, token }) => {
      const result = await sendEmail({
        to: email,
        subject: `You're invited to ${organizationName} on TimeTrack`,
        react: (
          <InvitationEmail
            organizationName={organizationName}
            roleLabel={roleLabel}
            acceptUrl={new URL(invitePath(token), getSiteUrl()).toString()}
            validDays={INVITATION_VALID_DAYS}
          />
        ),
      });
      return { email, ok: result.ok };
    }),
  );

  return results.filter((result) => !result.ok).map((result) => result.email);
}
