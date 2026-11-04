import { getWeekdayOf } from "@/lib/time/calendarDate";
import { formatCalendarDate } from "@/lib/time/formatDate";
import { describeDuration, formatDuration } from "@/lib/time/formatDuration";

import { getDayBadge } from "./dayStatusDisplay";

import type { DaySummary } from "../types/attendance";
import type { StatusTone } from "@/components/shared/StatusBadge";

/** What a day's icon shows; overtime wins over complete and day off. */
export type CalendarDayKind =
  "complete" | "overtime" | "short" | "absent" | "day_off" | "in_progress";

export interface CalendarCell {
  isoDate: string;
  dayOfMonth: number;
  /** Null for days still to come. */
  kind: CalendarDayKind | null;
  /** Null for days still to come. */
  badge: { label: string; tone: StatusTone } | null;
  workedText: string | null;
  isLate: boolean;
  isToday: boolean;
  /** The cell's accessible name: everything the colors and icons say. */
  description: string;
}

/** Calendar rows of 7, padded with nulls so day 1 lands on its weekday. */
export function toCalendarWeeks(
  days: readonly DaySummary[],
  weekStartsOn: number,
  todayIsoDate: string,
): (CalendarCell | null)[][] {
  const first = days[0];
  if (!first) return [];

  const leading = (getWeekdayOf(first.isoDate) - weekStartsOn + 7) % 7;
  const cells: (CalendarCell | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...days.map((day) => toCalendarCell(day, todayIsoDate)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (CalendarCell | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export function toCalendarCell(
  day: DaySummary,
  todayIsoDate: string,
): CalendarCell {
  const isUpcoming = day.status === "upcoming";
  const badge = isUpcoming ? null : getDayBadge(day);
  const showWorked = !isUpcoming && day.workedMinutes > 0;

  return {
    isoDate: day.isoDate,
    dayOfMonth: Number(day.isoDate.slice(8, 10)),
    kind: isUpcoming ? null : getDayKind(day),
    badge,
    workedText: showWorked ? formatDuration(day.workedMinutes) : null,
    isLate: day.isLate,
    isToday: day.isoDate === todayIsoDate,
    description: describeDay(day, badge?.label ?? "Upcoming"),
  };
}

function getDayKind(day: DaySummary): CalendarDayKind | null {
  if (day.status === "upcoming") return null;
  if (day.overtimeMinutes > 0 && day.status !== "in_progress") {
    return "overtime";
  }
  return day.status;
}

/** "Tue, 3 Nov: Short, 7 hours 20 minutes worked, 40 minutes short, late". */
export function describeDay(day: DaySummary, label: string): string {
  const parts = [`${formatCalendarDate(day.isoDate)}: ${label}`];
  if (day.status !== "upcoming" && day.workedMinutes > 0) {
    parts.push(`${describeDuration(day.workedMinutes)} worked`);
  }
  if (day.overtimeMinutes > 0) {
    parts.push(`${describeDuration(day.overtimeMinutes)} overtime`);
  }
  if (day.shortfallMinutes > 0) {
    parts.push(`${describeDuration(day.shortfallMinutes)} short`);
  }
  if (day.isLate) parts.push("late");
  return parts.join(", ");
}
