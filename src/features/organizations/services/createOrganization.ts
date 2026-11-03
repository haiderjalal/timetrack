import "server-only";

import { toScheduleParams } from "@/features/schedules/utils/toScheduleParams";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createOrganizationRecord } from "../repositories/organizationRepository";

import type { CreateOrganizationResult } from "../repositories/organizationRepository";
import type { CreateOrganizationInput } from "@/lib/validations/organization.schema";

/**
 * Creates an org owned by the signed-in person. The database function checks
 * who is calling and does every write in one transaction.
 */
export async function createOrganizationForCurrentUser(
  input: CreateOrganizationInput,
): Promise<CreateOrganizationResult> {
  const supabase = await createSupabaseServerClient();

  return createOrganizationRecord(supabase, {
    name: input.name,
    slug: input.slug,
    timezone: input.timezone,
    schedule: toScheduleParams(input.schedule),
  });
}
