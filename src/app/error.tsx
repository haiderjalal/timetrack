"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

interface ErrorPageProps {
  error: unknown;
  retry: () => void;
}

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
        <Button onClick={() => retry()}>Try again</Button>
        <Button asChild variant="outline">
          <Link href={ROUTES.home}>Back to home</Link>
        </Button>
      </EmptyState>
    </main>
  );
}
