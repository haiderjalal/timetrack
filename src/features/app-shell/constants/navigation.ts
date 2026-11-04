import { CalendarDays, LayoutDashboard, Users } from "lucide-react";

import {
  orgDashboardPath,
  orgTeamPath,
  orgTimesheetPath,
} from "@/constants/routes";

import type { LucideIcon } from "lucide-react";
import type { Route } from "next";

export type NavItemId = "dashboard" | "timesheet" | "team";

export interface NavItem {
  label: string;
  /** Shorter label for the mobile tab bar. */
  tabLabel: string;
  /** The route segment under `/o/[orgSlug]`, used to mark the active page. */
  segment: string;
  href: (orgSlug: string) => Route;
  icon: LucideIcon;
}

export interface NavGroup {
  id: "me" | "manage";
  label: string;
  items: readonly NavItemId[];
  /** Only owners and admins get this group; the server never sends it to members. */
  managersOnly: boolean;
}

export const NAV_ITEMS: Record<NavItemId, NavItem> = {
  dashboard: {
    label: "Dashboard",
    tabLabel: "Home",
    segment: "dashboard",
    href: orgDashboardPath,
    icon: LayoutDashboard,
  },
  timesheet: {
    label: "Timesheet",
    tabLabel: "Time",
    segment: "timesheet",
    href: (orgSlug) => orgTimesheetPath(orgSlug),
    icon: CalendarDays,
  },
  team: {
    label: "Team",
    tabLabel: "Team",
    segment: "team",
    href: orgTeamPath,
    icon: Users,
  },
};

// Only pages that exist are linked (docs/design-system.md §4). Leave joins
// "Me", and Approvals, Reports and Settings join "Manage", in the roadmap
// phase that builds each page.
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: "me",
    label: "Me",
    items: ["dashboard", "timesheet"],
    managersOnly: false,
  },
  { id: "manage", label: "Manage", items: ["team"], managersOnly: true },
];

export function getNavItemBySegment(segment: string | null): NavItem | null {
  return (
    Object.values(NAV_ITEMS).find((item) => item.segment === segment) ?? null
  );
}
