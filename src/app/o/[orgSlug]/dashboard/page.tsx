import { Suspense } from "react";

import { OrganizationCard } from "@/features/dashboard/components/OrganizationCard";
import { TodayCard } from "@/features/dashboard/components/TodayCard";
import { WorkingHoursCard } from "@/features/dashboard/components/WorkingHoursCard";
import { getDashboardOverview } from "@/features/dashboard/services/dashboard";
import { requireMembership } from "@/features/organizations/services/membership";
import { getFirstName } from "@/lib/getFirstName";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export default function DashboardPage({
  params,
}: PageProps<"/o/[orgSlug]/dashboard">) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard params={params} />
      </Suspense>
    </div>
  );
}

async function Dashboard({
  params,
}: Pick<PageProps<"/o/[orgSlug]/dashboard">, "params">) {
  const { orgSlug } = await params;
  const { user, membership } = await requireMembership(orgSlug);
  const { organization } = membership;
  const overview = await getDashboardOverview(organization);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <TodayCard
        firstName={getFirstName(user.name)}
        now={overview.now}
        today={overview.today}
        graceMinutes={overview.schedule?.graceMinutes ?? 0}
      />
      <div className="flex flex-col gap-6">
        {overview.schedule ? (
          <WorkingHoursCard
            schedule={overview.schedule}
            weekStartsOn={organization.weekStartsOn}
            todayWeekday={overview.now.weekday}
          />
        ) : null}
        <OrganizationCard
          membership={membership}
          memberCount={overview.memberCount}
        />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
    >
      <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-xs">
        <span className="flex flex-col gap-2">
          <span className="h-4 w-24 rounded bg-muted motion-safe:animate-pulse" />
          <span className="h-8 w-64 max-w-full rounded bg-muted motion-safe:animate-pulse" />
          <span className="h-4 w-56 max-w-full rounded bg-muted motion-safe:animate-pulse" />
        </span>
        <span className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={index}
              className="h-16 rounded-lg bg-muted motion-safe:animate-pulse"
            />
          ))}
        </span>
      </div>
      <div className="flex flex-col gap-6">
        <span className="h-96 rounded-xl border bg-card motion-safe:animate-pulse" />
        <span className="h-40 rounded-xl border bg-card motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
