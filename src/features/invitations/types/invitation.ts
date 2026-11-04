import type { InvitableRole } from "@/features/organizations/utils/roles";
import type { OrganizationRole } from "@/features/organizations/types/organization";

/** An invitation nobody has accepted or revoked yet. */
export interface OpenInvitation {
  id: string;
  email: string;
  role: InvitableRole;
  expiresAt: string;
}

/** An open invitation, with whether its link has already run out. */
export interface PendingInvitation extends OpenInvitation {
  isExpired: boolean;
}

/**
 * An open invitation addressed to the signed-in person. Its id joins it; the token
 * never reaches the page.
 */
export interface MyInvitation {
  id: string;
  organizationName: string;
  organizationSlug: string;
  organizationTimeZone: string;
  role: InvitableRole;
  expiresAt: string;
}

export const INVITATION_PREVIEW_STATES = [
  "ready",
  "wrong_account",
  "expired",
  "unavailable",
] as const;

export type InvitationPreviewState = (typeof INVITATION_PREVIEW_STATES)[number];

/** What the invitation page shows before the person joins. */
export interface InvitationPreview {
  state: InvitationPreviewState;
  organizationName: string | null;
  organizationSlug: string | null;
  role: OrganizationRole | null;
}

/** The outcome of an invite request, shown to the admin who sent it. */
export interface InviteMembersSummary {
  invited: string[];
  alreadyMembers: string[];
  failed: string[];
}
