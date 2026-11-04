import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { acceptMyInvitationRecord } from "../repositories/invitationRepository";

import type { AcceptInvitationResult } from "../repositories/invitationRepository";

/** Joins the signed-in person to the org that invited their address. */
export async function acceptInvitationByIdForCurrentUser(
  invitationId: string,
): Promise<AcceptInvitationResult> {
  const supabase = await createSupabaseServerClient();
  return acceptMyInvitationRecord(supabase, invitationId);
}
