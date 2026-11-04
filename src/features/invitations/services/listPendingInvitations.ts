import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { listOpenInvitations } from "../repositories/invitationRepository";
import { isInvitationExpired } from "../utils/isInvitationExpired";

import type { PendingInvitation } from "../types/invitation";

/** Open invitations for the team page, with expiry checked against the current time. */
export async function listPendingInvitations(
  orgId: string,
): Promise<PendingInvitation[]> {
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const invitations = await listOpenInvitations(supabase, orgId);

  return invitations.map((invitation) => ({
    ...invitation,
    isExpired: isInvitationExpired(invitation.expiresAt, now),
  }));
}
