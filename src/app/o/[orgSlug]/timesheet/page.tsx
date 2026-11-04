import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { orgTimesheetPath } from "@/constants/routes";
import { AttendanceCalendar } from "@/features/attendance/components/AttendanceCalendar";
import { AttendanceDayList } from "@/features/attendance/components/AttendanceDayList";
import { MonthSummary } from "@/features/attendance/components/MonthSummary";
import { getMemberMonth } from "@/features/attendance/services/memberMonth";
import { requireMembership } from "@/features/organizations/services/membership";
import { formatMonth } from "@/lib/time/calendarDate";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timesheet",
  robots: { index: false },
};

type TimesheetPageProps = PageProps<"/o/[orgSlug]/timesheet">;

/** My month: calendar, totals and every session (docs/design-system.md §4). */
export default function TimesheetPage({
  params,
  searchParams,
}: TimesheetPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
      <Suspense fallback={<TimesheetSkeleton />}>
        <Timesheet params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Timesheet({ params, searchParams }: TimesheetPageProps) {
  const [{ orgSlug }, query] = await Promise.all([params, searchParams]);
  const { user, membership } = await requireMembership(orgSlug);
  const { organization } = membership;
  const requested = typeof query.month === "string" ? query.month : undefined;
  const month = await getMemberMonth(organization, user.id, requested);
  const monthName = formatMonth(month.month);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2
          id="month-title"
          className="text-xl font-semibold tracking-tight"
          aria-live="polite"
        >
          {monthName}
        </h2>
        <nav aria-label="Months" className="flex items-center gap-1">
          <Link
            href={orgTimesheetPath(organization.slug, month.previousMonth)}
            className={buttonVariants({ variant: "outline", size: "icon-lg" })}
          >
            <ChevronLeft aria-hidden="true" />
            <span className="sr-only">
              Previous month, {formatMonth(month.previousMonth)}
            </span>
          </Link>
          {month.nextMonth ? (
            <Link
              href={orgTimesheetPath(organization.slug, month.nextMonth)}
              className={buttonVariants({
                variant: "outline",
                size: "icon-lg",
              })}
            >
              <ChevronRight aria-hidden="true" />
              <span className="sr-only">
                Next month, {formatMonth(month.nextMonth)}
              </span>
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={buttonVariants({
                variant: "outline",
                size: "icon-lg",
                className: "pointer-events-none opacity-40",
              })}
            >
              <ChevronRight />
            </span>
          )}
        </nav>
      </div>

      <MonthSummary summary={month.summary} />

      <section
        aria-labelledby="month-title"
        className="rounded-xl border bg-card p-2 shadow-xs sm:p-4"
      >
        <AttendanceCalendar
          titleId="month-title"
          days={month.days.map((day) => day.summary)}
          weekStartsOn={organization.weekStartsOn}
          todayIsoDate={month.todayIsoDate}
        />
      </section>

      <section aria-labelledby="days-title" className="flex flex-col gap-3">
        <h2 id="days-title" className="text-base font-semibold">
          Day by day
        </h2>
        <AttendanceDayList
          days={month.days}
          timeZone={organization.timezone}
          serverNow={month.serverNow}
        />
      </section>
    </>
  );
}

function TimesheetSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <span className="flex items-center justify-between">
        <span className="h-7 w-44 rounded bg-muted motion-safe:animate-pulse" />
        <span className="flex gap-1">
          <span className="size-11 rounded-lg bg-muted motion-safe:animate-pulse" />
          <span className="size-11 rounded-lg bg-muted motion-safe:animate-pulse" />
        </span>
      </span>
      <span className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <span
            key={index}
            className="h-24 rounded-xl border bg-card motion-safe:animate-pulse"
          />
        ))}
      </span>
      <span className="h-96 rounded-xl border bg-card motion-safe:animate-pulse" />
    </div>
  );
}
