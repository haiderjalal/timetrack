import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDuration } from "@/lib/time/formatDuration";

import type { StatusTone } from "@/components/shared/StatusBadge";
import type { CSSProperties } from "react";

interface DayPreview {
  day: string;
  workedMinutes: number;
  tone: StatusTone;
  status: string;
}

// Illustrative week, matching the examples in docs/business-rules.md §4.
const WEEK: DayPreview[] = [
  { day: "Mon", workedMinutes: 505, tone: "overtime", status: "+25m" },
  { day: "Tue", workedMinutes: 440, tone: "short", status: "Short · late" },
  { day: "Wed", workedMinutes: 550, tone: "overtime", status: "+1h 10m" },
  { day: "Thu", workedMinutes: 270, tone: "leave", status: "½ day leave" },
  { day: "Fri", workedMinutes: 372, tone: "present", status: "In progress" },
];

const SCALE_MINUTES = 10 * 60;
const REQUIRED_MINUTES = 8 * 60;

// Bars show worked time: green, or amber when the day fell short. Overtime is
// drawn as a separate purple segment past the 8h line.
function barColor(tone: StatusTone): string {
  return tone === "short" ? "bg-status-short" : "bg-status-present";
}

export function MemberWeekPreview() {
  return (
    <div className="grid gap-6 rounded-2xl border bg-card p-6 shadow-xs md:grid-cols-[1fr_16rem] md:p-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-semibold">Your week</h3>
          <span className="text-xs text-muted-foreground">
            line = 8h required
          </span>
        </div>
        <ul className="flex flex-col gap-3">
          {WEEK.map((entry, index) => {
            const regular = Math.min(entry.workedMinutes, REQUIRED_MINUTES);
            const extra = Math.max(0, entry.workedMinutes - REQUIRED_MINUTES);
            return (
              <li
                key={entry.day}
                className="grid grid-cols-[2.5rem_1fr_4.5rem] items-center gap-3 text-sm sm:grid-cols-[2.5rem_1fr_4.5rem_7.5rem]"
              >
                <span className="text-muted-foreground">{entry.day}</span>
                <span className="relative flex h-2.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className={`animate-grow-x ${barColor(entry.tone)}`}
                    style={
                      {
                        width: `${(regular / SCALE_MINUTES) * 100}%`,
                        "--enter-delay": `${index * 80}ms`,
                      } as CSSProperties
                    }
                  />
                  {extra > 0 ? (
                    <span
                      className="animate-grow-x bg-status-overtime"
                      style={
                        {
                          width: `${(extra / SCALE_MINUTES) * 100}%`,
                          "--enter-delay": `${index * 80 + 300}ms`,
                        } as CSSProperties
                      }
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-[80%] w-px bg-foreground/30"
                  />
                </span>
                <span className="text-right font-medium tabular">
                  {formatDuration(entry.workedMinutes)}
                </span>
                <span className="hidden sm:block">
                  <StatusBadge tone={entry.tone}>{entry.status}</StatusBadge>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3 self-start md:grid-cols-1">
        <div className="rounded-xl bg-status-overtime-soft p-4">
          <p className="text-xs font-medium text-status-overtime-foreground">
            Overtime this week
          </p>
          <p className="text-2xl font-semibold text-status-overtime-foreground tabular">
            +1h 35m
          </p>
        </div>
        <div className="rounded-xl bg-muted p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Annual leave left
          </p>
          <p className="text-2xl font-semibold tabular">9 days</p>
        </div>
      </div>
    </div>
  );
}
