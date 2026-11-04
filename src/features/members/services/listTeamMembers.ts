import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { listTeamMembers } from "../repositories/memberRepository";
import { sortTeamMembers } from "../utils/sortTeamMembers";

import type { TeamMember } from "../types/member";

export async function listTeamMembersForOrg(
  orgId: string,
): Promise<TeamMember[]> {
  const supabase = await createSupabaseServerClient();
  return sortTeamMembers(await listTeamMembers(supabase, orgId));
}
