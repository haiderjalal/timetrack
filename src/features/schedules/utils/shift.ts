import { formatClockTime } from "@/lib/time/formatDuration";

import type { ScheduleDay, WorkSchedule } from "../types/schedule";

const MINUTES_PER_HOUR = 60;

/** `"09:30"` → 570. */
export function toMinuteOfDay(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * MINUTES_PER_HOUR + minutes;
}

/**
 * An end time at or before the start time means the shift ends the next day,
 * the same rule the auto-close job uses (supabase/migrations/*_auto_close.sql).
 */
export function crossesMidnight(startTime: string, endTime: string): boolean {
  return toMinuteOfDay(endTime) <= toMinuteOfDay(startTime);
}

/** "09:00 – 18:00", or "22:00 – 06:00 next day" for a shift past midnight. */
export function formatShiftRange(day: ScheduleDay): string | null {
  if (!day.isWorkingDay || !day.startTime || !day.endTime) return null;

  const range = `${day.startTime} – ${day.endTime}`;
  return crossesMidnight(day.startTime, day.endTime)
    ? `${range} next day`
    : range;
}

/**
 * The last on-time clock-in: start time plus grace. Later than this counts as
 * late (business-rules.md §4).
 */
export function getLateAfter(startTime: string, graceMinutes: number): string {
  return formatClockTime(toMinuteOfDay(startTime) + graceMinutes);
}

export interface ScheduledDay {
  day: ScheduleDay;
  graceMinutes: number;
}

/**
 * The rule for one date: the newest version that started on or before it
 * (business-rules.md §8.3). Null before the org's first version.
 */
export function getScheduledDay(
  versions: readonly WorkSchedule[],
  isoDate: string,
  weekday: number,
): ScheduledDay | null {
  const version = versions
    .filter((candidate) => candidate.effectiveFrom <= isoDate)
    .reduce<WorkSchedule | null>(
      (latest, candidate) =>
        !latest || candidate.effectiveFrom > latest.effectiveFrom
          ? candidate
          : latest,
      null,
    );
  const day = version?.days.find((item) => item.weekday === weekday);

  if (!version || !day) return null;
  return { day, graceMinutes: version.graceMinutes };
}
