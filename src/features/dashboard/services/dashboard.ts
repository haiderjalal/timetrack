import "server-only";

import { buildAttendanceDays } from "@/features/attendance/services/attendanceDays";
import { summarizePeriod } from "@/features/attendance/services/attendanceCalculator";
import { countActiveMembers } from "@/features/organizations/repositories/organizationRepository";
import { listScheduleVersions } from "@/features/schedules/repositories/scheduleRepository";
import { getVersionInEffect } from "@/features/schedules/utils/shift";
import {
  getLatestEntryForMember,
  listEntriesForMember,
} from "@/features/time-tracking/services/timeTracking";
import { addDays, startOfWeek } from "@/lib/time/calendarDate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getZonedNow } from "@/lib/time/zonedNow";

import type { AttendanceDay } from "@/features/attendance/services/attendanceDays";
import type { PeriodSummary } from "@/features/attendance/types/attendance";
import type { Organization } from "@/features/organizations/types/organization";
import type {
  ScheduleDay,
  WorkSchedule,
} from "@/features/schedules/types/schedule";
import type { TimeEntry } from "@/features/time-tracking/types/timeEntry";
import type { ZonedNow } from "@/lib/time/zonedNow";

export interface DashboardOverview {
  /** Now, in the org timezone. */
  now: ZonedNow;
  /** The same moment as epoch milliseconds, for live timers. */
  serverNow: number;
  /** The working hours in effect today, or null before the first version starts. */
  schedule: WorkSchedule | null;
  today: ScheduleDay | null;
  memberCount: number;
  /** The latest session, open or not. */
  latestEntry: TimeEntry | null;
  /**
   * The day the clock card is about: today, or the day a still-running session
   * started (a night shift past midnight still counts toward that day).
   */
  focus: AttendanceDay;
  week: { days: AttendanceDay[]; summary: PeriodSummary };
}

/** Everything the dashboard shows, loaded in parallel under the person's RLS. */
export async function getDashboardOverview(
  organization: Organization,
  userId: string,
): Promise<DashboardOverview> {
  const instant = new Date();
  const now = getZonedNow(organization.timezone, instant);
  const weekStart = startOfWeek(now.isoDate, organization.weekStartsOn);
  const weekEnd = addDays(weekStart, 6);
  // A session closes within 24h, so a running one started today or yesterday.
  const yesterday = addDays(now.isoDate, -1);
  const fromDate = yesterday < weekStart ? yesterday : weekStart;
  const supabase = await createSupabaseServerClient();

  const [versions, entries, latestEntry, memberCount] = await Promise.all([
    listScheduleVersions(supabase, organization.id, fromDate, weekEnd),
    listEntriesForMember(organization.id, userId, fromDate, weekEnd),
    getLatestEntryForMember(organization.id, userId),
    countActiveMembers(supabase, organization.id),
  ]);

  const context = { timeZone: organization.timezone, now: instant };
  const days = buildAttendanceDays(
    { fromDate, toDate: weekEnd },
    versions,
    entries,
    context,
  );
  const weekDays = days.filter((day) => day.summary.isoDate >= weekStart);
  const runningDate =
    latestEntry?.clockOutAt === null ? latestEntry.workDate : null;
  const focus =
    days.find((day) => day.summary.isoDate === runningDate) ??
    days.find((day) => day.summary.isoDate === now.isoDate);
  if (!focus) throw new Error("Today is always inside the loaded range.");
  const schedule = getVersionInEffect(versions, now.isoDate);

  return {
    now,
    serverNow: instant.getTime(),
    schedule,
    today: schedule?.days.find((day) => day.weekday === now.weekday) ?? null,
    memberCount,
    latestEntry,
    focus,
    week: {
      days: weekDays,
      summary: summarizePeriod(weekDays.map((day) => day.summary)),
    },
  };
}
