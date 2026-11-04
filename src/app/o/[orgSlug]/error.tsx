"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/routes";

interface OrganizationErrorProps {
  error: unknown;
  retry: () => void;
}

/** A page inside an org failed. The shell around it stays usable. */
export default function OrganizationError({
  error,
  retry,
}: OrganizationErrorProps) {
  useEffect(() => {
    // Replaced by Sentry reporting in the hardening phase.
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={TriangleAlert}
        title="This page didn't load"
        description="Check your connection and try again. If it keeps happening, let your organization's admin know."
      >
        <button
          type="button"
          className={buttonVariants()}
          onClick={() => retry()}
        >
          Try again
        </button>
        <Link
          href={ROUTES.account}
          className={buttonVariants({ variant: "outline" })}
        >
          Your account
        </Link>
      </EmptyState>
    </div>
  );
}
