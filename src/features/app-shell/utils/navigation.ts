import { canManageOrganization } from "@/features/organizations/utils/roles";

import { NAV_GROUPS } from "../constants/navigation";

import type { NavGroup } from "../constants/navigation";
import type { OrganizationRole } from "@/features/organizations/types/organization";

/** The nav groups this role may see, leaving out groups with no pages yet. */
export function getNavGroups(
  role: OrganizationRole,
  groups: readonly NavGroup[] = NAV_GROUPS,
): NavGroup[] {
  return groups.filter(
    (group) =>
      group.items.length > 0 &&
      (!group.managersOnly || canManageOrganization(role)),
  );
}

/** A bottom tab bar needs somewhere to go: hide it until there are two pages. */
export const MIN_TABS = 2;

export function countNavItems(groups: readonly NavGroup[]): number {
  return groups.reduce((total, group) => total + group.items.length, 0);
}
