import type { InviteMembersSummary } from "../types/invitation";

/** One line for the dialog, e.g. "Sent 2 invitations. 1 is already on the team." */
export function describeInviteSummary({
  invited,
  alreadyMembers,
  failed,
}: InviteMembersSummary): string {
  const parts: string[] = [];

  if (invited.length > 0) {
    parts.push(`Sent ${countOf(invited.length, "invitation")}.`);
  }
  if (alreadyMembers.length > 0) {
    const verb = alreadyMembers.length === 1 ? "is" : "are";
    parts.push(`${alreadyMembers.length} ${verb} already on the team.`);
  }
  if (failed.length > 0) {
    parts.push(
      `${countOf(failed.length, "address")} couldn't be invited. Try again.`,
    );
  }

  return parts.length > 0 ? parts.join(" ") : "Nothing to send.";
}

function countOf(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
