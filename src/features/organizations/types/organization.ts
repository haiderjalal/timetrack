import type { CurrentUser } from "@/features/auth/types/currentUser";
import type { Enums } from "@/types/database.types";

export type OrganizationRole = Enums<"member_role">;

export interface Organization {
  id: string;
  name: string;
  slug: string;
  /** IANA zone; every date and schedule in the org uses it. */
  timezone: string;
  /** 0 = Sunday … 6 = Saturday. */
  weekStartsOn: number;
}

/** One of the signed-in person's active memberships. */
export interface Membership {
  role: OrganizationRole;
  organization: Organization;
}

/** Everything a page inside `/o/[orgSlug]` knows about who is looking. */
export interface OrganizationContext {
  user: CurrentUser;
  membership: Membership;
  /** All of the person's active orgs, for the org switcher. */
  memberships: Membership[];
}
