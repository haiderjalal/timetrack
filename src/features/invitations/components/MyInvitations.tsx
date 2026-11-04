import { getCurrentUser } from "@/features/auth/services/currentUser";
import { ROLE_LABELS } from "@/features/organizations/utils/roles";
import { formatDateInZone } from "@/lib/time/formatDateInZone";

import { listInvitationsForCurrentUser } from "../services/listMyInvitations";

import { JoinInvitationButton } from "./JoinInvitationButton";

/**
 * Invitations addressed to the signed-in email. Joining from here doesn't need the
 * email link. Renders nothing when there are none.
 */
export async function MyInvitations() {
  const user = await getCurrentUser();
  if (!user) return null;

  const invitations = await listInvitationsForCurrentUser();
  if (invitations.length === 0) return null;

  return (
    <section
      aria-labelledby="my-invitations-title"
      className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs"
    >
      <h2 id="my-invitations-title" className="text-base font-semibold">
        Invitations for you
      </h2>

      <ul className="flex flex-col divide-y">
        {invitations.map((invitation) => (
          <li
            key={invitation.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {invitation.organizationName}
              </p>
              <p className="text-sm text-muted-foreground">
                {ROLE_LABELS[invitation.role]} · Expires{" "}
                {formatDateInZone(
                  invitation.expiresAt,
                  invitation.organizationTimeZone,
                )}
              </p>
            </div>
            <JoinInvitationButton
              invitationId={invitation.id}
              organizationName={invitation.organizationName}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
