import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { changeMemberRoleRecord } from "../repositories/memberRepository";

import type { InvitableRole } from "@/features/organizations/utils/roles";
import type { MemberResult } from "../repositories/memberRepository";

export async function changeMemberRoleForOrg(params: {
  orgId: string;
  userId: string;
  role: InvitableRole;
}): Promise<MemberResult> {
  const supabase = await createSupabaseServerClient();
  return changeMemberRoleRecord(supabase, params);
}
