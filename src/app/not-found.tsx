import Link from "next/link";
import { FileQuestionMark } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/routes";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center bg-canvas">
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
    </main>
  );
}
