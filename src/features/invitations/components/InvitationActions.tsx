"use client";

import { useState, useTransition } from "react";

import { buttonVariants } from "@/components/ui/button-variants";

import { inviteMembers } from "../actions/inviteMembers";
import { revokeInvitation } from "../actions/revokeInvitation";
import { describeInviteSummary } from "../utils/describeInviteSummary";

import type { PendingInvitation } from "../types/invitation";

interface InvitationActionsProps {
  orgSlug: string;
  invitation: PendingInvitation;
}

/** Resend sends a fresh link (and the database revokes the old one). Revoke cancels it. */
export function InvitationActions({
  orgSlug,
  invitation,
}: InvitationActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    startTransition(async () => {
      const result = await revokeInvitation(orgSlug, invitation.id);
      setMessage(result.success ? null : result.message);
    });
  }

  return (
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
  );
}
