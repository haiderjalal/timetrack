import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { revokeInvitationRecord } from "../repositories/invitationRepository";

import type { InvitationResult } from "../repositories/invitationRepository";

/** Cancels an open invitation. The link in its email stops working at once. */
export async function revokeOpenInvitation(
  invitationId: string,
): Promise<InvitationResult> {
  const supabase = await createSupabaseServerClient();
  return revokeInvitationRecord(supabase, invitationId);
}
