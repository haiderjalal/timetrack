import { formatCalendarDate } from "@/lib/time/formatDate";
import { formatDuration } from "@/lib/time/formatDuration";
import { getGreeting } from "@/lib/time/greeting";
import {
  formatShiftRange,
  getLateAfter,
} from "@/features/schedules/utils/shift";

import type { ScheduleDay } from "@/features/schedules/types/schedule";
import type { ZonedNow } from "@/lib/time/zonedNow";
import type { ReactNode } from "react";

interface TodayCardProps {
  firstName: string | null;
  now: ZonedNow;
  /** Today's rule from the schedule in effect; null if there isn't one yet. */
  today: ScheduleDay | null;
  graceMinutes: number;
  /** The clock card and today's sessions. */
  children: ReactNode;
}

/** Greeting, today's shift and the clock (docs/design-system.md §6.1). */
export function TodayCard({
  firstName,
  now,
  today,
  graceMinutes,
  children,
}: TodayCardProps) {
  const greeting = firstName
    ? `${getGreeting(now.hour)}, ${firstName}`
    : getGreeting(now.hour);

  return (
    <section
      aria-labelledby="today-title"
      className="flex flex-col gap-6 rounded-xl border bg-card p-5 shadow-xs sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground tabular">
          <time dateTime={now.isoDate}>{formatCalendarDate(now.isoDate)}</time>
        </p>
        <h2 id="today-title" className="text-2xl font-semibold tracking-tight">
          {greeting}
        </h2>
        <p className="text-sm text-muted-foreground tabular">
          {describeToday(today, graceMinutes)}
        </p>
      </div>
      {children}
    </section>
  );
}

function describeToday(
  today: ScheduleDay | null,
  graceMinutes: number,
): string {
  if (!today) return "Your organization's working hours start soon.";
  const shift = formatShiftRange(today);
  if (!shift || !today.startTime) return "Day off today.";
  return `Shift today ${shift} · ${formatDuration(today.requiredMinutes)} required · late after ${getLateAfter(today.startTime, graceMinutes)}`;
}
