import type { OrganizationRole } from "@/features/organizations/types/organization";
import type { Enums } from "@/types/database.types";

export type MemberStatus = Enums<"member_status">;

/** One person on the team, as the team page lists them. */
export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: OrganizationRole;
  status: MemberStatus;
  joinedAt: string;
}
