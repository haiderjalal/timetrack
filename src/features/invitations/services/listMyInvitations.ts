import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { listMyOpenInvitations } from "../repositories/invitationRepository";

import type { MyInvitation } from "../types/invitation";

/** Open invitations for the signed-in person's email, for their account and onboarding pages. */
export async function listInvitationsForCurrentUser(): Promise<MyInvitation[]> {
  const supabase = await createSupabaseServerClient();
  return listMyOpenInvitations(supabase);
}
