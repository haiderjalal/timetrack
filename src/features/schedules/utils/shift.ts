import { formatClockTime } from "@/lib/time/formatDuration";

import type { ScheduleDay } from "../types/schedule";

const MINUTES_PER_HOUR = 60;

function toMinuteOfDay(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * MINUTES_PER_HOUR + minutes;
}

/** "09:00 – 18:00", or "22:00 – 06:00 next day" for a shift past midnight. */
export function formatShiftRange(day: ScheduleDay): string | null {
  if (!day.isWorkingDay || !day.startTime || !day.endTime) return null;

  const crossesMidnight =
    toMinuteOfDay(day.endTime) < toMinuteOfDay(day.startTime);
  const range = `${day.startTime} – ${day.endTime}`;
  return crossesMidnight ? `${range} next day` : range;
}

/**
 * The last on-time clock-in: start time plus grace. Later than this counts as
 * late (business-rules.md §4).
 */
export function getLateAfter(startTime: string, graceMinutes: number): string {
  return formatClockTime(toMinuteOfDay(startTime) + graceMinutes);
}
