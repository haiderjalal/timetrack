"use client";

import { useState, useTransition } from "react";

import { buttonVariants } from "@/components/ui/button-variants";

import { acceptInvitation } from "../actions/acceptInvitation";

interface AcceptInvitationPanelProps {
  token: string;
  organizationName: string;
}

/**
 * The join button. It's a button, not a link that runs on load, so an email
 * security scanner that fetches the URL can't use up the invitation.
 */
export function AcceptInvitationPanel({
  token,
  organizationName,
}: AcceptInvitationPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function accept(): void {
    startTransition(async () => {
      // On success the action redirects, so it only returns with a failure.
      const result = await acceptInvitation(token);
      setError(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={accept}
        disabled={isPending}
        className={buttonVariants({ size: "lg" })}
      >
        {isPending ? "Joining…" : `Join ${organizationName}`}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
