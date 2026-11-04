import { getScheduledDay } from "@/features/schedules/utils/shift";
import { getWeekdayOf, listDates } from "@/lib/time/calendarDate";

import { summarizeDay } from "./attendanceCalculator";

import type { CalculationContext } from "./attendanceCalculator";
import type { DaySummary } from "../types/attendance";
import type { WorkSchedule } from "@/features/schedules/types/schedule";
import type { TimeEntry } from "@/features/time-tracking/types/timeEntry";

export interface AttendanceDay {
  summary: DaySummary;
  entries: TimeEntry[];
}

/**
 * One summary per date from `fromDate` to `toDate`, each with its sessions,
 * using the working-hours version in effect on that date.
 */
export function buildAttendanceDays(
  range: { fromDate: string; toDate: string },
  versions: readonly WorkSchedule[],
  entries: readonly TimeEntry[],
  context: CalculationContext,
): AttendanceDay[] {
  return listDates(range.fromDate, range.toDate).map((isoDate) => {
    const dayEntries = entries.filter((entry) => entry.workDate === isoDate);
    return {
      entries: dayEntries,
      summary: summarizeDay(
        {
          isoDate,
          scheduled: getScheduledDay(versions, isoDate, getWeekdayOf(isoDate)),
          sessions: dayEntries,
        },
        context,
      ),
    };
  });
}
