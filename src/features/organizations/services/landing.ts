import "server-only";

import { ROUTES, orgDashboardPath } from "@/constants/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  getLastOrganizationId,
  listActiveMemberships,
} from "../repositories/organizationRepository";
import { pickLandingOrganization } from "../utils/landing";

/**
 * Where someone goes after sign-in when they didn't ask for a page: their
 * last org's dashboard, or onboarding if they don't belong to an org yet.
 */
export async function resolveLandingPath(userId: string): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const [memberships, lastOrgId] = await Promise.all([
    listActiveMemberships(supabase, userId),
    getLastOrganizationId(supabase, userId),
  ]);

  const organization = pickLandingOrganization(memberships, lastOrgId);
  return organization ? orgDashboardPath(organization.slug) : ROUTES.onboarding;
}
