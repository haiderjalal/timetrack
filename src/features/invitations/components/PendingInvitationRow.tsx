"use client";

import { useState, useTransition } from "react";

import { buttonVariants } from "@/components/ui/button-variants";
import { ROLE_LABELS } from "@/features/organizations/utils/roles";

import { inviteMembers } from "../actions/inviteMembers";
import { revokeInvitation } from "../actions/revokeInvitation";
import { describeInviteSummary } from "../utils/describeInviteSummary";

import type { PendingInvitation } from "../types/invitation";

interface PendingInvitationRowProps {
  orgSlug: string;
  invitation: PendingInvitation;
  /** The expiry, already worded by the server, which knows the org's timezone. */
  expiry: string;
}

/**
 * One pending invitation. Revoke hides the row at once, before the server answers,
 * and shows it again with the reason if the revoke fails.
 */
export function PendingInvitationRow({
  orgSlug,
  invitation,
  expiry,
}: PendingInvitationRowProps) {
  const [revoked, setRevoked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Resend sends a fresh link, and the database revokes the old one.
  function resend(): void {
    startTransition(async () => {
      const result = await inviteMembers(orgSlug, {
        emails: [invitation.email],
        role: invitation.role,
      });
      setMessage(
        result.success ? describeInviteSummary(result.data) : result.message,
      );
    });
  }

  function revoke(): void {
    setRevoked(true);
    startTransition(async () => {
      const result = await revokeInvitation(orgSlug, invitation.id);
      if (!result.success) {
        setRevoked(false);
        setMessage(result.message);
      }
    });
  }

  if (revoked) return null;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{invitation.email}</p>
        <p className="text-sm text-muted-foreground">
          {ROLE_LABELS[invitation.role]} · {expiry}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resend}
            disabled={isPending}
            aria-label={`Resend invitation to ${invitation.email}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Resend
          </button>
          <button
            type="button"
            onClick={revoke}
            disabled={isPending}
            aria-label={`Revoke invitation to ${invitation.email}`}
            className={buttonVariants({ variant: "destructive", size: "sm" })}
          >
            Revoke
          </button>
        </div>
        <p role="status" className="text-xs text-muted-foreground empty:hidden">
          {message}
        </p>
      </div>
    </li>
  );
}
