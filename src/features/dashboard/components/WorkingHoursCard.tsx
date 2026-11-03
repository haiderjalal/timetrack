import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatShiftRange } from "@/features/schedules/utils/shift";
import { formatCalendarDate } from "@/lib/time/formatDate";
import { describeDuration, formatDuration } from "@/lib/time/formatDuration";
import { getWeekdays } from "@/lib/time/weekdays";

import type { WorkSchedule } from "@/features/schedules/types/schedule";

interface WorkingHoursCardProps {
  schedule: WorkSchedule;
  weekStartsOn: number;
  todayWeekday: number;
}

/** The org's week at a glance, today marked. */
export function WorkingHoursCard({
  schedule,
  weekStartsOn,
  todayWeekday,
}: WorkingHoursCardProps) {
  return (
    <section
      aria-labelledby="hours-title"
      className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-xs"
    >
      <div className="flex flex-col gap-0.5">
        <h2 id="hours-title" className="text-base font-semibold">
          Working hours
        </h2>
        <p className="text-xs text-muted-foreground">
          Since {formatCalendarDate(schedule.effectiveFrom)} ·{" "}
          {schedule.graceMinutes} min grace
        </p>
      </div>

      <ul className="flex flex-col">
        {getWeekdays(weekStartsOn).map((weekday) => {
          const day = schedule.days.find(
            (item) => item.weekday === weekday.value,
          );
          const shift = day ? formatShiftRange(day) : null;
          const isToday = weekday.value === todayWeekday;

          return (
            <li
              key={weekday.value}
              aria-current={isToday ? "date" : undefined}
              className="flex min-h-10 items-center gap-3 border-b text-sm last:border-b-0 aria-[current=date]:font-semibold"
            >
              <span className="w-10 shrink-0 text-muted-foreground in-aria-[current=date]:text-foreground">
                <abbr title={weekday.name} className="no-underline">
                  {weekday.shortName}
                </abbr>
              </span>
              {day && shift ? (
                <>
                  <span className="flex-1 whitespace-nowrap tabular">
                    {shift}
                  </span>
                  <span className="text-muted-foreground tabular">
                    <span aria-hidden="true">
                      {formatDuration(day.requiredMinutes)}
                    </span>
                    <span className="sr-only">
                      {describeDuration(day.requiredMinutes)} required
                    </span>
                  </span>
                </>
              ) : (
                <span className="flex-1">
                  <StatusBadge tone="off">Day off</StatusBadge>
                </span>
              )}
              {isToday ? (
                <span className="text-xs font-medium text-brand">Today</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
