import "server-only";

import { listScheduleVersions } from "@/features/schedules/repositories/scheduleRepository";
import { listEntriesForMember } from "@/features/time-tracking/services/timeTracking";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  addMonths,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  getMonthOf,
  isIsoMonth,
} from "@/lib/time/calendarDate";
import { getZonedNow } from "@/lib/time/zonedNow";

import { buildAttendanceDays } from "./attendanceDays";
import { summarizePeriod } from "./attendanceCalculator";

import type { AttendanceDay } from "./attendanceDays";
import type { PeriodSummary } from "../types/attendance";
import type { Organization } from "@/features/organizations/types/organization";

export interface MemberMonth {
  /** `YYYY-MM`. */
  month: string;
  todayIsoDate: string;
  previousMonth: string;
  /** Null when this is the current month: there is nothing to see ahead. */
  nextMonth: string | null;
  days: AttendanceDay[];
  summary: PeriodSummary;
  serverNow: number;
}

/**
 * The signed-in person's month in one org (docs/business-rules.md §9, "members
 * see the same breakdown for themselves only"). `requestedMonth` comes from
 * the URL: anything that isn't a past or current `YYYY-MM` shows this month.
 */
export async function getMemberMonth(
  organization: Organization,
  userId: string,
  requestedMonth: string | undefined,
): Promise<MemberMonth> {
  const instant = new Date();
  const today = getZonedNow(organization.timezone, instant).isoDate;
  const currentMonth = getMonthOf(today);
  const month =
    requestedMonth &&
    isIsoMonth(requestedMonth) &&
    requestedMonth <= currentMonth
      ? requestedMonth
      : currentMonth;
  const range = {
    fromDate: getFirstDayOfMonth(month),
    toDate: getLastDayOfMonth(month),
  };
  const supabase = await createSupabaseServerClient();

  const [versions, entries] = await Promise.all([
    listScheduleVersions(
      supabase,
      organization.id,
      range.fromDate,
      range.toDate,
    ),
    listEntriesForMember(organization.id, userId, range.fromDate, range.toDate),
  ]);
  const days = buildAttendanceDays(range, versions, entries, {
    timeZone: organization.timezone,
    now: instant,
  });

  return {
    month,
    todayIsoDate: today,
    previousMonth: addMonths(month, -1),
    nextMonth: month < currentMonth ? addMonths(month, 1) : null,
    days,
    summary: summarizePeriod(days.map((day) => day.summary)),
    serverNow: instant.getTime(),
  };
}
