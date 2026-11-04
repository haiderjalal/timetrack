import { TriangleAlert } from "lucide-react";

import {
  describeDuration,
  formatDuration,
  formatSignedDuration,
} from "@/lib/time/formatDuration";

import type { PeriodSummary } from "../types/attendance";

interface MonthSummaryProps {
  summary: PeriodSummary;
}

/** The month in numbers, so far (docs/business-rules.md §9, for oneself). */
export function MonthSummary({ summary }: MonthSummaryProps) {
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Worked"
          value={formatDuration(summary.workedMinutes)}
          valueLabel={describeDuration(summary.workedMinutes)}
          detail={`of ${formatDuration(summary.requiredMinutes)} required`}
        />
        <Stat
          label="Overtime"
          value={formatSignedDuration(summary.overtimeMinutes)}
          valueLabel={describeDuration(summary.overtimeMinutes)}
          detail="counted day by day"
          tone="text-status-overtime-foreground"
        />
        <Stat
          label="Shortfall"
          value={formatSignedDuration(-summary.shortfallMinutes)}
          valueLabel={describeDuration(summary.shortfallMinutes)}
          detail={`${summary.shortDays} short ${summary.shortDays === 1 ? "day" : "days"}`}
          tone={
            summary.shortfallMinutes > 0
              ? "text-status-short-foreground"
              : undefined
          }
        />
        <Stat
          label="Present"
          value={`${summary.presentDays} / ${summary.workingDays}`}
          valueLabel={`${summary.presentDays} of ${summary.workingDays} working days`}
          detail={`${summary.absentDays} absent · ${summary.lateDays} late`}
        />
      </dl>
      {summary.autoClosedSessions > 0 ? (
        <p className="flex items-center gap-2 text-sm text-status-short-foreground">
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          {summary.autoClosedSessions}{" "}
          {summary.autoClosedSessions === 1 ? "session was" : "sessions were"}{" "}
          closed automatically and may need an admin&apos;s correction.
        </p>
      ) : null}
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  /** Screen-reader wording for an abbreviated value. */
  valueLabel: string;
  detail: string;
  tone?: string;
}

function Stat({ label, value, valueLabel, detail, tone }: StatProps) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-xs">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="flex flex-col gap-0.5">
        <span
          aria-hidden="true"
          className={`text-2xl font-semibold tracking-tight tabular ${tone ?? ""}`}
        >
          {value}
        </span>
        <span className="sr-only">{valueLabel}</span>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </dd>
    </div>
  );
}
