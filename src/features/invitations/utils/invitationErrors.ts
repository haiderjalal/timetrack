/** The errors the invitation functions raise (see supabase/migrations/20261104090100_invitations.sql). */
export const INVITATION_FAILURES = [
  "not_allowed",
  "invalid_role",
  "already_member",
  "invitation_conflict",
  "invitation_unavailable",
  "invitation_expired",
  "invitation_email_mismatch",
  "not_authenticated",
] as const;

export type InvitationFailure =
  (typeof INVITATION_FAILURES)[number] | "unknown";

/** What the person sees. Never the database's own wording. */
export function describeInvitationFailure(failure: InvitationFailure): string {
  switch (failure) {
    case "not_allowed":
      return "You don't have permission to do that.";
    case "invalid_role":
      return "Choose admin or member.";
    case "already_member":
      return "That person is already on the team.";
    case "invitation_conflict":
      return "Someone just invited that address. Try again.";
    case "invitation_unavailable":
      return "This invitation is no longer valid. Ask for a new one.";
    case "invitation_expired":
      return "This invitation has expired. Ask for a new one.";
    case "invitation_email_mismatch":
      return "This invitation was sent to a different email address. Sign in with that address to join.";
    case "not_authenticated":
      return "Sign in to continue.";
    case "unknown":
      return "Something went wrong. Please try again.";
  }
}
