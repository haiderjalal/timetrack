import Link from "next/link";
import { Building2, ChevronRight, Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES, orgDashboardPath } from "@/constants/routes";
import { requireUser } from "@/features/auth/services/currentUser";

import { getMemberships } from "../services/membership";
import { ROLE_LABELS } from "../utils/roles";

import type { Membership } from "../types/organization";

/** The account page's list of orgs, each linking to its dashboard. */
export async function YourOrganizations() {
  const user = await requireUser(ROUTES.account);

  let memberships: Membership[];
  try {
    memberships = await getMemberships(user.id);
  } catch {
    // Logged by the repository; the rest of the account page still works.
    return (
      <p
        role="alert"
        className="rounded-xl border bg-card p-5 text-sm text-muted-foreground"
      >
        We couldn&apos;t load your organizations. Refresh the page to try again.
      </p>
    );
  }

  return (
    <section
      aria-labelledby="organizations-title"
      className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="organizations-title" className="text-lg font-semibold">
          Your organizations
        </h2>
        <Link
          href={ROUTES.onboarding}
          className={buttonVariants({ variant: "outline" })}
        >
          <Plus aria-hidden="true" />
          Create organization
        </Link>
      </div>

      {memberships.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You&apos;re not in an organization yet. Create one, or ask your admin
          to invite you.
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-xl border">
          {memberships.map(({ organization, role }) => (
            <li key={organization.id}>
              <Link
                href={orgDashboardPath(organization.slug)}
                className="flex min-h-14 items-center gap-3 px-4 py-2 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                <Building2
                  aria-hidden="true"
                  className="size-5 shrink-0 text-muted-foreground"
                  strokeWidth={1.75}
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {organization.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ROLE_LABELS[role]}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function YourOrganizationsSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-xs"
    >
      <span className="h-6 w-48 rounded-md bg-muted motion-safe:animate-pulse" />
      <span className="h-14 rounded-xl bg-muted motion-safe:animate-pulse" />
    </div>
  );
}
