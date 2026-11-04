import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/shared/Logo";
import { ROUTES } from "@/constants/routes";
import {
  AccountCard,
  AccountCardSkeleton,
} from "@/features/auth/components/AccountCard";
import {
  YourOrganizations,
  YourOrganizationsSkeleton,
} from "@/features/organizations/components/YourOrganizations";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center px-4 sm:px-6">
          <Link
            href={ROUTES.home}
            aria-label="TimeTrack home"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <Logo />
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
        {/* The page shell is static; the user (from the session) streams in. */}
        <Suspense fallback={<AccountCardSkeleton />}>
          <AccountCard />
        </Suspense>
        <Suspense fallback={<YourOrganizationsSkeleton />}>
          <YourOrganizations />
        </Suspense>
      </main>
    </div>
  );
}
