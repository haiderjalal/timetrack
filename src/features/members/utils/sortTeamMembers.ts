import type { OrganizationRole } from "@/features/organizations/types/organization";

import type { TeamMember } from "../types/member";

const ROLE_ORDER: Record<OrganizationRole, number> = {
  owner: 0,
  admin: 1,
  member: 2,
};

/** Active people first, then owners, admins and members, then by name. */
export function sortTeamMembers(members: TeamMember[]): TeamMember[] {
  return [...members].sort((a, b) => {
    if (a.status !== b.status) return a.status === "active" ? -1 : 1;
    if (a.role !== b.role) return ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
    return a.name.localeCompare(b.name);
  });
}
