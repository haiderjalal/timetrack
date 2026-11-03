"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/routes";

interface ErrorPageProps {
  error: unknown;
  retry: () => void;
}

// The root error boundary loads with every page, so it uses buttonVariants
// directly instead of <Button> to keep `cn` and Radix Slot out of the bundle.
export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    // Replaced by Sentry reporting in the hardening phase.
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center bg-canvas">
      <EmptyState
        icon={TriangleAlert}
        titleAs="h1"
        title="Something went wrong"
        description="We couldn't load this page. Try again, and if it keeps happening, let your organization's admin know."
      >
        <button
          type="button"
          className={buttonVariants()}
          onClick={() => retry()}
        >
          Try again
        </button>
        <Link
          href={ROUTES.home}
          className={buttonVariants({ variant: "outline" })}
        >
          Back to home
        </Link>
      </EmptyState>
    </main>
  );
}
