import { Suspense } from "react";

import { OrganizationCard } from "@/features/dashboard/components/OrganizationCard";
import { TodayCard } from "@/features/dashboard/components/TodayCard";
import { WeekCard } from "@/features/dashboard/components/WeekCard";
import { WorkingHoursCard } from "@/features/dashboard/components/WorkingHoursCard";
import { getDashboardOverview } from "@/features/dashboard/services/dashboard";
import { requireMembership } from "@/features/organizations/services/membership";
import { ClockCard } from "@/features/time-tracking/components/ClockCard";
import { SessionList } from "@/features/time-tracking/components/SessionList";
import { sumClosedSeconds } from "@/features/time-tracking/utils/clockDisplay";
import { getFirstName } from "@/lib/getFirstName";
import { formatCalendarDate, formatTimeInZone } from "@/lib/time/formatDate";

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
  const overview = await getDashboardOverview(organization, user.id);
  const { focus, latestEntry, now } = overview;
  const timeZone = organization.timezone;

  const running = latestEntry?.clockOutAt === null ? latestEntry : null;
  const autoClosedAt =
    latestEntry?.autoClosed && latestEntry.clockOutAt
      ? describeAutoClose(latestEntry.clockOutAt, latestEntry.workDate)
      : null;
  const isToday = focus.summary.isoDate === now.isoDate;

  function describeAutoClose(clockOutAt: string, workDate: string): string {
    const time = formatTimeInZone(clockOutAt, timeZone);
    return workDate === now.isoDate
      ? time
      : `${time} on ${formatCalendarDate(workDate)}`;
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <TodayCard
        firstName={getFirstName(user.name)}
        now={now}
        today={overview.today}
        graceMinutes={overview.schedule?.graceMinutes ?? 0}
      >
        <ClockCard
          orgSlug={organization.slug}
          serverNow={overview.serverNow}
          running={
            running
              ? {
                  clockInAt: running.clockInAt,
                  time: formatTimeInZone(running.clockInAt, timeZone),
                }
              : null
          }
          closedSeconds={sumClosedSeconds(focus.entries)}
          requiredMinutes={focus.summary.requiredMinutes}
          isWorkingDay={focus.summary.isWorkingDay}
          autoClosedAt={autoClosedAt}
        />
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">
            {isToday
              ? "Today's sessions"
              : `Sessions for ${formatCalendarDate(focus.summary.isoDate)}`}
          </h3>
          <SessionList
            entries={focus.entries}
            timeZone={timeZone}
            serverNow={overview.serverNow}
            emptyText="No sessions yet today. Clock in to start one."
          />
        </div>
      </TodayCard>
      <div className="flex flex-col gap-6">
        <WeekCard
          days={overview.week.days.map((day) => day.summary)}
          summary={overview.week.summary}
          todayIsoDate={now.isoDate}
        />
        {overview.schedule ? (
          <WorkingHoursCard
            schedule={overview.schedule}
            weekStartsOn={organization.weekStartsOn}
            todayWeekday={now.weekday}
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
      <div className="flex flex-col gap-6 rounded-xl border bg-card p-5 shadow-xs sm:p-6">
        <span className="flex flex-col gap-2">
          <span className="h-4 w-24 rounded bg-muted motion-safe:animate-pulse" />
          <span className="h-8 w-64 max-w-full rounded bg-muted motion-safe:animate-pulse" />
          <span className="h-4 w-72 max-w-full rounded bg-muted motion-safe:animate-pulse" />
        </span>
        <span className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <span className="size-44 shrink-0 rounded-full bg-muted motion-safe:animate-pulse sm:size-48" />
          <span className="flex w-full max-w-64 flex-col gap-3">
            <span className="h-4 w-40 rounded bg-muted motion-safe:animate-pulse" />
            <span className="h-12 w-56 max-w-full rounded bg-muted motion-safe:animate-pulse" />
            <span className="h-4 w-24 rounded bg-muted motion-safe:animate-pulse" />
          </span>
        </span>
        <span className="h-11 w-full rounded-xl bg-muted motion-safe:animate-pulse sm:w-48" />
        <span className="h-24 rounded-lg bg-muted motion-safe:animate-pulse" />
      </div>
      <div className="flex flex-col gap-6">
        <span className="h-80 rounded-xl border bg-card motion-safe:animate-pulse" />
        <span className="h-96 rounded-xl border bg-card motion-safe:animate-pulse" />
        <span className="h-40 rounded-xl border bg-card motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
