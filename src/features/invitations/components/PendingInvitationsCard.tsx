import { formatDateInZone } from "@/lib/time/formatDateInZone";

import { PendingInvitationRow } from "./PendingInvitationRow";

import type { PendingInvitation } from "../types/invitation";

interface PendingInvitationsCardProps {
  orgSlug: string;
  /** The org's timezone, so expiry dates read the way the admin's calendar does. */
  timeZone: string;
  invitations: PendingInvitation[];
}

/** Open invitations for admins to resend or revoke. Revoked and accepted ones leave the list. */
export function PendingInvitationsCard({
  orgSlug,
  timeZone,
  invitations,
}: PendingInvitationsCardProps) {
  return (
    <section
      aria-labelledby="pending-invitations-title"
      className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs"
    >
      <h2 id="pending-invitations-title" className="text-base font-semibold">
        Pending invitations
      </h2>

      {invitations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No one is waiting to join.
        </p>
      ) : (
        <ul className="flex flex-col divide-y">
          {invitations.map((invitation) => (
            <PendingInvitationRow
              key={invitation.id}
              orgSlug={orgSlug}
              invitation={invitation}
              expiry={
                invitation.isExpired
                  ? "Expired"
                  : `Expires ${formatDateInZone(invitation.expiresAt, timeZone)}`
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}
