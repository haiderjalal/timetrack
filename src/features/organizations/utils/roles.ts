import type { OrganizationRole } from "../types/organization";

export const ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

/** Owners and admins run the org: team, hours, approvals, reports (business-rules.md §1). */
export function canManageOrganization(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}
