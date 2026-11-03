import type { Membership, Organization } from "../types/organization";

/**
 * The org to open after sign-in: the one used last, if the person still
 * belongs to it, otherwise the one they joined first.
 */
export function pickLandingOrganization(
  memberships: Membership[],
  lastOrgId: string | null,
): Organization | null {
  const lastUsed = memberships.find(
    (membership) => membership.organization.id === lastOrgId,
  );
  return (lastUsed ?? memberships[0])?.organization ?? null;
}
