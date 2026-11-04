import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import { orgDashboardPath } from "@/constants/routes";
import { requireUser } from "@/features/auth/services/currentUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { listActiveMemberships } from "../repositories/organizationRepository";

import type { Membership, OrganizationContext } from "../types/organization";

/** The signed-in person's orgs, read once per request under their own RLS. */
export const getMemberships = cache(
  async (userId: string): Promise<Membership[]> => {
    const supabase = await createSupabaseServerClient();
    return listActiveMemberships(supabase, userId);
  },
);

/**
 * The data-access check for every page, layout and action inside
 * `/o/[orgSlug]`: a verified user who is an active member of that org.
 * Anyone else gets a 404, so org slugs can't be probed.
 */
export const requireMembership = cache(
  async (orgSlug: string): Promise<OrganizationContext> => {
    const user = await requireUser(orgDashboardPath(orgSlug));
    const memberships = await getMemberships(user.id);
    const slug = orgSlug.toLowerCase();
    const membership = memberships.find(
      (candidate) => candidate.organization.slug === slug,
    );

    if (!membership) notFound();
    return { user, membership, memberships };
  },
);
