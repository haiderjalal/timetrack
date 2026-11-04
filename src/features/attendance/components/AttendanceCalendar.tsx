import { Check, Clock, Minus, TrendingDown, TrendingUp, X } from "lucide-react";

import { getWeekdays } from "@/lib/time/weekdays";

import { toCalendarWeeks } from "../utils/calendarDays";
import { CalendarKeyboardGrid } from "./CalendarKeyboardGrid";

import type { DaySummary } from "../types/attendance";
import type { CalendarCell, CalendarDayKind } from "../utils/calendarDays";
import type { LucideIcon } from "lucide-react";

// A different shape per status, so color is never the only signal.
const KIND_STYLES: Record<CalendarDayKind, { icon: LucideIcon; cell: string }> =
  {
    complete: {
      icon: Check,
      cell: "bg-status-present-soft text-status-present-foreground",
    },
    overtime: {
      icon: TrendingUp,
      cell: "bg-status-overtime-soft text-status-overtime-foreground",
    },
    short: {
      icon: TrendingDown,
      cell: "bg-status-short-soft text-status-short-foreground",
    },
    absent: {
      icon: X,
      cell: "bg-status-absent-soft text-status-absent-foreground",
    },
    day_off: { icon: Minus, cell: "bg-muted/60 text-muted-foreground" },
    in_progress: {
      icon: Clock,
      cell: "bg-status-present-soft text-status-present-foreground",
    },
  };

interface AttendanceCalendarProps {
  titleId: string;
  days: readonly DaySummary[];
  weekStartsOn: number;
  todayIsoDate: string;
}

/**
 * The month at a glance (docs/design-system.md §3 AttendanceCalendar): each
 * day shows its status and hours, and opens that day's sessions below.
 */
export function AttendanceCalendar({
  titleId,
  days,
  weekStartsOn,
  todayIsoDate,
}: AttendanceCalendarProps) {
  const weeks = toCalendarWeeks(days, weekStartsOn, todayIsoDate);
  const cells = weeks.flat();
  // One tab stop: today, or the latest day that has happened.
  const focusDate =
    cells.find((cell) => cell?.isToday)?.isoDate ??
    cells.filter((cell) => cell?.kind).at(-1)?.isoDate;

  return (
    <CalendarKeyboardGrid labelledBy={titleId}>
      <thead>
        <tr>
          {getWeekdays(weekStartsOn).map((weekday) => (
            <th
              key={weekday.value}
              scope="col"
              className="pb-1 text-xs font-medium text-muted-foreground"
            >
              <abbr title={weekday.name} className="no-underline">
                {weekday.shortName}
              </abbr>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, row) => (
          <tr key={week.find(Boolean)?.isoDate ?? row}>
            {week.map((cell, column) => (
              <td key={cell?.isoDate ?? `blank-${column}`} className="p-0">
                {cell ? (
                  <DayCell
                    cell={cell}
                    position={row * 7 + column}
                    isTabStop={cell.isoDate === focusDate}
                  />
                ) : null}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </CalendarKeyboardGrid>
  );
}

interface DayCellProps {
  cell: CalendarCell;
  position: number;
  isTabStop: boolean;
}

function DayCell({ cell, position, isTabStop }: DayCellProps) {
  const base =
    "flex h-14 flex-col justify-between rounded-lg p-1.5 text-xs sm:h-20 sm:p-2";
  const today = cell.isToday ? " ring-2 ring-brand ring-inset" : "";

  if (!cell.kind) {
    return (
      <span className={`${base} text-muted-foreground/70${today}`}>
        <span className="tabular">{cell.dayOfMonth}</span>
      </span>
    );
  }

  const { icon: Icon, cell: tone } = KIND_STYLES[cell.kind];
  return (
    <a
      href={`#day-${cell.isoDate}`}
      data-calendar-day=""
      data-position={position}
      tabIndex={isTabStop ? 0 : -1}
      aria-label={cell.description}
      aria-current={cell.isToday ? "date" : undefined}
      className={`${base} ${tone}${today} outline-none hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:hover:brightness-110`}
    >
      <span className="flex items-center justify-between gap-1">
        <span className="font-semibold tabular">{cell.dayOfMonth}</span>
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-tight max-sm:hidden">
        <span className="truncate font-medium">
          {cell.badge?.label}
          {cell.isLate ? " · Late" : ""}
        </span>
        {cell.workedText ? (
          <span className="tabular opacity-80">{cell.workedText}</span>
        ) : null}
      </span>
    </a>
  );
}
