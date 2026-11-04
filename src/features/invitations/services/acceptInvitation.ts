import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  acceptInvitationRecord,
  previewInvitationRecord,
} from "../repositories/invitationRepository";

import type { AcceptInvitationResult } from "../repositories/invitationRepository";
import type { InvitationPreview } from "../types/invitation";

/** The org and role for the invitation page. Only someone signed in sees them. */
export async function getInvitationPreview(
  token: string,
): Promise<InvitationPreview> {
  const supabase = await createSupabaseServerClient();
  return previewInvitationRecord(supabase, token);
}

/** Joins the signed-in person to the org that sent the invitation. */
export async function acceptInvitationForCurrentUser(
  token: string,
): Promise<AcceptInvitationResult> {
  const supabase = await createSupabaseServerClient();
  return acceptInvitationRecord(supabase, token);
}
