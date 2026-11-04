import type { INVITABLE_ROLES } from "@/lib/validations/invitation.schema";
import type { OrganizationRole } from "../types/organization";

/** Owners are never invited: ownership comes from creating the org. */
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export const ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

/** Owners and admins run the org: team, hours, approvals, reports (business-rules.md §1). */
export function canManageOrganization(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function isInvitableRole(role: OrganizationRole): role is InvitableRole {
  return role !== "owner";
}

/** Owners invite admins and members; admins invite members only (business-rules.md §1). */
export function canInviteAs(
  actor: OrganizationRole,
  role: InvitableRole,
): boolean {
  if (actor === "owner") return true;
  return actor === "admin" && role === "member";
}

/**
 * Only owners change roles, and only between admin and member. Owners keep their
 * role, because ownership transfer isn't built yet.
 */
export function canChangeRole(
  actor: OrganizationRole,
  target: OrganizationRole,
): boolean {
  return actor === "owner" && target !== "owner";
}

/** Owners can deactivate anyone; admins can deactivate members only (business-rules.md §1). */
export function canDeactivate(
  actor: OrganizationRole,
  target: OrganizationRole,
): boolean {
  if (actor === "owner") return true;
  return actor === "admin" && target === "member";
}
