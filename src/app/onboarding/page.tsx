import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/shared/Logo";
import { ROUTES } from "@/constants/routes";
import { CurrentUserMenu } from "@/features/auth/components/CurrentUserMenu";
import { OnboardingForm } from "@/features/organizations/components/OnboardingForm";
import { getSiteUrl } from "@/lib/getSiteUrl";
import { listTimezones } from "@/lib/time/timezones";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your organization",
  robots: { index: false },
};

/**
 * Create an org (docs/architecture.md §6.2). The form is part of the static
 * shell; the Server Action checks the session again before creating anything.
 */
export default function OnboardingPage() {
  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href={ROUTES.home}
            aria-label="TimeTrack home"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <Logo />
          </Link>
          <Suspense
            fallback={
              <span
                aria-hidden="true"
                className="size-8 rounded-full bg-muted motion-safe:animate-pulse"
              />
            }
          >
            <CurrentUserMenu returnTo={ROUTES.onboarding} />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your organization
          </h1>
          <p className="text-sm text-muted-foreground">
            Name your team&apos;s workspace and set its working hours.
            You&apos;ll be its owner.
          </p>
        </div>
        <OnboardingForm
          timezones={listTimezones()}
          siteHost={getSiteUrl().host}
        />
      </main>
    </div>
  );
}
