/** The errors change_member_role() and deactivate_member() raise. */
export const MEMBER_FAILURES = [
  "not_allowed",
  "invalid_role",
  "member_not_found",
  "cannot_deactivate_self",
  "last_owner",
  "not_authenticated",
] as const;

export type MemberFailure = (typeof MEMBER_FAILURES)[number] | "unknown";

/** What the person sees. Never the database's own wording. */
export function describeMemberFailure(failure: MemberFailure): string {
  switch (failure) {
    case "not_allowed":
      return "You don't have permission to change this person.";
    case "invalid_role":
      return "Choose admin or member.";
    case "member_not_found":
      return "That person is no longer an active member. Refresh the page.";
    case "cannot_deactivate_self":
      return "You can't deactivate your own account.";
    case "last_owner":
      return "An organization needs at least one active owner.";
    case "not_authenticated":
      return "Sign in to continue.";
    case "unknown":
      return "Something went wrong. Please try again.";
  }
}
