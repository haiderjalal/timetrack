import { StatusBadge } from "@/components/shared/StatusBadge";
import { SessionList } from "@/features/time-tracking/components/SessionList";
import { formatCalendarDate } from "@/lib/time/formatDate";
import {
  describeDuration,
  formatDuration,
  formatSignedDuration,
} from "@/lib/time/formatDuration";

import { getDayBadge } from "../utils/dayStatusDisplay";

import type { AttendanceDay } from "../services/attendanceDays";

interface AttendanceDayListProps {
  days: readonly AttendanceDay[];
  timeZone: string;
  serverNow: number;
}

/** Every day so far, newest first, with its sessions. Calendar cells link here. */
export function AttendanceDayList({
  days,
  timeZone,
  serverNow,
}: AttendanceDayListProps) {
  const pastDays = days
    .filter((day) => day.summary.status !== "upcoming")
    .reverse();

  if (pastDays.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nothing yet this month.</p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {pastDays.map(({ summary, entries }) => {
        const badge = getDayBadge(summary);
        return (
          <li
            key={summary.isoDate}
            id={`day-${summary.isoDate}`}
            tabIndex={-1}
            className="flex scroll-mt-24 flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs outline-none target:ring-2 target:ring-brand focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h3 className="font-semibold">
                <time dateTime={summary.isoDate}>
                  {formatCalendarDate(summary.isoDate)}
                </time>
              </h3>
              <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
              {summary.isLate ? (
                <StatusBadge tone="short">Late</StatusBadge>
              ) : null}
              <span className="ml-auto text-sm tabular">
                <span aria-hidden="true">
                  {formatDuration(summary.workedMinutes)}
                  {summary.requiredMinutes > 0 ? (
                    <span className="text-muted-foreground">
                      {" "}
                      / {formatDuration(summary.requiredMinutes)}
                    </span>
                  ) : null}
                </span>
                <span className="sr-only">
                  {describeDuration(summary.workedMinutes)} worked
                  {summary.requiredMinutes > 0
                    ? ` of ${describeDuration(summary.requiredMinutes)}`
                    : ""}
                </span>
                <DayDelta
                  overtime={summary.overtimeMinutes}
                  shortfall={summary.shortfallMinutes}
                />
              </span>
            </div>
            {entries.length > 0 ? (
              <SessionList
                entries={entries}
                timeZone={timeZone}
                serverNow={serverNow}
                emptyText=""
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function DayDelta({
  overtime,
  shortfall,
}: {
  overtime: number;
  shortfall: number;
}) {
  if (overtime > 0) {
    return (
      <span className="ml-2 font-medium text-status-overtime-foreground">
        {formatSignedDuration(overtime)}
        <span className="sr-only"> overtime</span>
      </span>
    );
  }
  if (shortfall > 0) {
    return (
      <span className="ml-2 font-medium text-status-short-foreground">
        {formatSignedDuration(-shortfall)}
        <span className="sr-only"> short</span>
      </span>
    );
  }
  return null;
}
