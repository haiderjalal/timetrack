"use client";

import { useState, useTransition } from "react";

import { buttonVariants } from "@/components/ui/button-variants";

import { acceptMyInvitation } from "../actions/acceptMyInvitation";

interface JoinInvitationButtonProps {
  invitationId: string;
  organizationName: string;
}

/** Joins an invitation from the account or onboarding page. Failures stay on the row. */
export function JoinInvitationButton({
  invitationId,
  organizationName,
}: JoinInvitationButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function join(): void {
    startTransition(async () => {
      // On success the action redirects, so it only returns with a failure.
      const result = await acceptMyInvitation(invitationId);
      setError(result.message);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={join}
        disabled={isPending}
        aria-label={`Join ${organizationName}`}
        className={buttonVariants({ size: "sm" })}
      >
        {isPending ? "Joining…" : "Join"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
