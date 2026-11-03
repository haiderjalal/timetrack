import Link from "next/link";
import { FileQuestionMark } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Logo } from "@/components/shared/Logo";
import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/routes";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="relative isolate flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden bg-canvas px-4 py-12">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-dot-grid opacity-60"
      />
      <Link
        href={ROUTES.home}
        aria-label="TimeTrack home"
        className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <Logo />
      </Link>
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-xs">
        <EmptyState
          icon={FileQuestionMark}
          titleAs="h1"
          title="Page not found"
          description="This page doesn't exist or has moved. Check the address, or head back to the start."
        >
          <Link href={ROUTES.home} className={buttonVariants()}>
            Back to home
          </Link>
        </EmptyState>
      </div>
    </main>
  );
}
