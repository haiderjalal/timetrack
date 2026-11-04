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
 * One email per new invitation. The invite action runs this after its response,
 * so a slow mail provider never holds up the admin's screen.
 */
export async function sendInvitationEmails({
  invitations,
  role,
  organizationName,
}: SendInvitationEmailsParams): Promise<void> {
  const roleLabel = ROLE_LABELS[role];

  await Promise.all(
    invitations.map(({ email, token }) =>
      sendEmail({
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
      }),
    ),
  );
}
