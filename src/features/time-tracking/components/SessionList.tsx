import { Monitor, Smartphone, TriangleAlert } from "lucide-react";

import { formatTimeInZone } from "@/lib/time/formatDate";
import { describeDuration, formatDuration } from "@/lib/time/formatDuration";

import { secondsSince } from "../utils/clockDisplay";
import { LiveDuration } from "./LiveDuration";

import type { TimeEntry } from "../types/timeEntry";

interface SessionListProps {
  entries: readonly TimeEntry[];
  timeZone: string;
  serverNow: number;
  /** Shown when there are no sessions. */
  emptyText: string;
}

/** A day's sessions: in → out, length, source, and an auto-closed tag. */
export function SessionList({
  entries,
  timeZone,
  serverNow,
  emptyText,
}: SessionListProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="divide-y rounded-lg border text-sm">
      {entries.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-1 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <SourceIcon source={entry.clockInSource} />
            <span className="tabular">
              {formatTimeInZone(entry.clockInAt, timeZone)}
              <span aria-hidden="true"> → </span>
              <span className="sr-only"> to </span>
              {entry.clockOutAt ? (
                formatTimeInZone(entry.clockOutAt, timeZone)
              ) : (
                <span className="font-medium text-status-present-foreground">
                  now
                </span>
              )}
            </span>
            <span className="ml-auto flex items-center gap-2 font-medium tabular">
              {entry.clockOutAt ? (
                <SessionLength entry={entry} clockOutAt={entry.clockOutAt} />
              ) : (
                <>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-status-present-foreground">
                    <span
                      aria-hidden="true"
                      className="live-dot size-2 rounded-full bg-status-live"
                    />
                    live
                  </span>
                  <LiveDuration since={entry.clockInAt} serverNow={serverNow} />
                </>
              )}
            </span>
          </div>
          {entry.autoClosed ? (
            <p className="flex items-center gap-1.5 text-xs text-status-short-foreground">
              <TriangleAlert className="size-3.5" aria-hidden="true" />
              Closed automatically: needs an admin&apos;s review
            </p>
          ) : null}
          {entry.note ? (
            <p className="text-xs break-words text-muted-foreground">
              <span className="sr-only">Note: </span>
              {entry.note}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function SessionLength({
  entry,
  clockOutAt,
}: {
  entry: TimeEntry;
  clockOutAt: string;
}) {
  const minutes = Math.floor(
    secondsSince(entry.clockInAt, Date.parse(clockOutAt)) / 60,
  );
  return (
    <>
      <span aria-hidden="true">{formatDuration(minutes)}</span>
      <span className="sr-only">{describeDuration(minutes)}</span>
    </>
  );
}

function SourceIcon({ source }: { source: TimeEntry["clockInSource"] }) {
  const Icon = source === "mobile" ? Smartphone : Monitor;
  const label =
    source === "mobile"
      ? "From the app"
      : source === "web"
        ? "From the web"
        : "Added by an admin";

  return (
    <span title={label} className="text-muted-foreground">
      <Icon className="size-4" aria-hidden="true" />
      <span className="sr-only">{label}: </span>
    </span>
  );
}
