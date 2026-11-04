import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { deactivateMemberRecord } from "../repositories/memberRepository";

import type { MemberResult } from "../repositories/memberRepository";

/** Removes access at once. The row and its history stay for reports. */
export async function deactivateMemberInOrg(params: {
  orgId: string;
  userId: string;
}): Promise<MemberResult> {
  const supabase = await createSupabaseServerClient();
  return deactivateMemberRecord(supabase, params);
}
