import { StatusBadge } from "@/components/shared/StatusBadge";
import { getDayBadge } from "@/features/attendance/utils/dayStatusDisplay";
import { getWeekdayOf } from "@/lib/time/calendarDate";
import { formatCalendarDate } from "@/lib/time/formatDate";
import {
  describeDuration,
  formatDuration,
  formatSignedDuration,
} from "@/lib/time/formatDuration";
import { getWeekdays } from "@/lib/time/weekdays";

import type {
  DaySummary,
  PeriodSummary,
} from "@/features/attendance/types/attendance";

interface WeekCardProps {
  days: readonly DaySummary[];
  summary: PeriodSummary;
  todayIsoDate: string;
}

// Bars run to 10h so a day with some overtime still fits: required time in
// green (amber when short), overtime in purple.
const SCALE_MINUTES = 10 * 60;

/** This week day by day: worked time, overtime or shortfall, and status. */
export function WeekCard({ days, summary, todayIsoDate }: WeekCardProps) {
  const weekdayNames = new Map(
    getWeekdays().map((weekday) => [weekday.value, weekday]),
  );

  return (
    <section
      aria-labelledby="week-title"
      className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs"
    >
      <h2 id="week-title" className="text-base font-semibold">
        This week
      </h2>

      <ul className="flex flex-col gap-2.5">
        {days.map((day) => {
          const weekday = weekdayNames.get(getWeekdayOf(day.isoDate));
          const isToday = day.isoDate === todayIsoDate;
          const regular = Math.min(day.workedMinutes, day.requiredMinutes);
          const extra = day.workedMinutes - regular;

          return (
            <li
              key={day.isoDate}
              aria-current={isToday ? "date" : undefined}
              className="grid grid-cols-[2.25rem_minmax(0,1fr)_4.25rem_5.5rem] items-center gap-2 text-sm aria-[current=date]:font-semibold"
            >
              <abbr
                title={formatCalendarDate(day.isoDate)}
                className="text-muted-foreground no-underline in-aria-[current=date]:text-foreground"
              >
                {weekday?.shortName}
              </abbr>
              <span
                aria-hidden="true"
                className="relative flex h-2 overflow-hidden rounded-full bg-muted"
              >
                <span
                  className={
                    day.status === "short"
                      ? "bg-status-short"
                      : "bg-status-present"
                  }
                  style={{
                    width: `${(Math.min(regular, SCALE_MINUTES) / SCALE_MINUTES) * 100}%`,
                  }}
                />
                {extra > 0 ? (
                  <span
                    className="bg-status-overtime"
                    style={{
                      width: `${(Math.min(extra, SCALE_MINUTES - regular) / SCALE_MINUTES) * 100}%`,
                    }}
                  />
                ) : null}
              </span>
              <span className="text-right tabular">
                {day.status === "upcoming" ? (
                  <span className="text-muted-foreground">–</span>
                ) : (
                  <>
                    <span aria-hidden="true">
                      {formatDuration(day.workedMinutes)}
                    </span>
                    <span className="sr-only">
                      {describeDuration(day.workedMinutes)} worked
                    </span>
                  </>
                )}
              </span>
              <span className="flex justify-end">
                <DayResult day={day} />
              </span>
            </li>
          );
        })}
      </ul>

      <dl className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Worked</dt>
          <dd className="font-semibold tabular">
            {formatDuration(summary.workedMinutes)}
            <span className="font-normal text-muted-foreground">
              {" "}
              of {formatDuration(summary.requiredMinutes)}
            </span>
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Overtime</dt>
          <dd className="font-semibold text-status-overtime-foreground tabular">
            {formatSignedDuration(summary.overtimeMinutes)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function DayResult({ day }: { day: DaySummary }) {
  if (day.status === "upcoming") return null;
  if (day.overtimeMinutes > 0) {
    return (
      <span className="text-xs font-medium text-status-overtime-foreground tabular">
        {formatSignedDuration(day.overtimeMinutes)}
        <span className="sr-only"> overtime</span>
      </span>
    );
  }
  if (day.status === "short") {
    return (
      <span className="text-xs font-medium text-status-short-foreground tabular">
        {formatSignedDuration(-day.shortfallMinutes)}
        <span className="sr-only"> short</span>
      </span>
    );
  }
  const badge = getDayBadge(day);
  return <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>;
}
