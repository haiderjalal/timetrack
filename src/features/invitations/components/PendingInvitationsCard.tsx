import { ROLE_LABELS } from "@/features/organizations/utils/roles";
import { formatDateInZone } from "@/lib/time/formatDateInZone";

import { InvitationActions } from "./InvitationActions";

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
          {invitations.map((invitation) => {
            const expiry = invitation.isExpired
              ? "Expired"
              : `Expires ${formatDateInZone(invitation.expiresAt, timeZone)}`;

            return (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {invitation.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {ROLE_LABELS[invitation.role]} · {expiry}
                  </p>
                </div>
                <InvitationActions orgSlug={orgSlug} invitation={invitation} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
