import { formatCalendarDate } from "@/lib/time/formatDate";
import { describeDuration, formatDuration } from "@/lib/time/formatDuration";
import { getGreeting } from "@/lib/time/greeting";
import {
  formatShiftRange,
  getLateAfter,
} from "@/features/schedules/utils/shift";

import type { ScheduleDay } from "@/features/schedules/types/schedule";
import type { ZonedNow } from "@/lib/time/zonedNow";

interface TodayCardProps {
  firstName: string | null;
  now: ZonedNow;
  /** Today's rule from the schedule in effect; null if there isn't one yet. */
  today: ScheduleDay | null;
  graceMinutes: number;
}

/** Greeting and today's shift (docs/design-system.md §6.1). */
export function TodayCard({
  firstName,
  now,
  today,
  graceMinutes,
}: TodayCardProps) {
  const greeting = firstName
    ? `${getGreeting(now.hour)}, ${firstName}`
    : getGreeting(now.hour);
  const shift = today ? formatShiftRange(today) : null;

  return (
    <section
      aria-labelledby="today-title"
      className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-xs"
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground tabular">
          <time dateTime={now.isoDate}>{formatCalendarDate(now.isoDate)}</time>
        </p>
        <h2 id="today-title" className="text-2xl font-semibold tracking-tight">
          {greeting}
        </h2>
        <p className="text-sm text-muted-foreground">
          {describeToday(today, shift)}
        </p>
      </div>

      {today?.isWorkingDay && today.startTime && today.endTime ? (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ShiftFact label="Starts" value={today.startTime} />
          <ShiftFact label="Ends" value={today.endTime} />
          <ShiftFact
            label="Required"
            value={formatDuration(today.requiredMinutes)}
            valueLabel={describeDuration(today.requiredMinutes)}
          />
          <ShiftFact
            label="Late after"
            value={getLateAfter(today.startTime, graceMinutes)}
          />
        </dl>
      ) : null}
    </section>
  );
}

function describeToday(
  today: ScheduleDay | null,
  shift: string | null,
): string {
  if (!today) return "Your organization's working hours start soon.";
  if (!shift) return "Day off today.";
  return `Shift today ${shift} · ${formatDuration(today.requiredMinutes)} required`;
}

interface ShiftFactProps {
  label: string;
  value: string;
  /** Screen-reader wording when the visible value is abbreviated. */
  valueLabel?: string;
}

function ShiftFact({ label, value, valueLabel }: ShiftFactProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted px-3 py-2.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold tabular">
        {valueLabel ? (
          <>
            <span aria-hidden="true">{value}</span>
            <span className="sr-only">{valueLabel}</span>
          </>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
